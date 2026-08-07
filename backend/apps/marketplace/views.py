from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.response import Response

from apps.gamification.services import PointsManager
from apps.users.permissions import IsMarketplaceAdmin

from .models import Order, Review, Service, ServiceAvailability, ServiceCategory
from .payments import (
    PaymentProviderError,
    PaymentWebhookError,
    get_provider,
)
from .serializers import (
    AdminOrderSerializer,
    AdminReviewSerializer,
    AdminServiceSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    ReviewSerializer,
    ServiceAvailabilitySerializer,
    ServiceCategorySerializer,
    ServiceDetailSerializer,
    ServiceListSerializer,
)

# --- Categories ---

class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


# --- Services ---

class ServiceListView(generics.ListCreateAPIView):
    serializer_class = ServiceListSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Service.objects.select_related('provider', 'category').all()
        status_filter = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        service_type = self.request.query_params.get('service_type')
        provider = self.request.query_params.get('provider')

        if self.request.method == 'GET' and not provider:
            qs = qs.filter(status=Service.Status.PUBLISHED)
        elif provider:
            qs = qs.filter(provider_id=provider)
            if self.request.user.is_authenticated and int(provider) == self.request.user.id:
                pass
            else:
                qs = qs.filter(status=Service.Status.PUBLISHED)
        if status_filter and self.request.user.is_staff:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category_id=category)
        if service_type:
            qs = qs.filter(service_type=service_type)
        return qs

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related('provider', 'category').prefetch_related('availability', 'reviews')
    serializer_class = ServiceDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method in ('PUT', 'PATCH', 'DELETE') and obj.provider != request.user and not request.user.is_staff:
            self.permission_denied(request)


# --- Availability ---

class ServiceAvailabilityListView(generics.ListCreateAPIView):
    serializer_class = ServiceAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ServiceAvailability.objects.filter(service_id=self.kwargs['service_pk'], service__provider=self.request.user)

    def perform_create(self, serializer):
        service = generics.get_object_or_404(Service, pk=self.kwargs['service_pk'], provider=self.request.user)
        serializer.save(service=service)


# --- Orders ---

class OrderListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get('role', 'buyer')
        if role == 'provider':
            return Order.objects.filter(service__provider=user).select_related('buyer', 'service')
        return Order.objects.filter(buyer=user).select_related('service')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        from apps.notifications.services import notify
        notify(
            order.service.provider,
            type='order',
            title={'ar': 'طلب جديد', 'en': 'New order'},
            body={
                'ar': f"استلمت طلباً جديداً على: {order.service.title.get('ar') or order.service.title.get('en', '')}",
                'en': f"You received a new order for: {order.service.title.get('en') or order.service.title.get('ar', '')}",
            },
            link='/marketplace/orders/?role=provider',
            icon='🛎️',
        )
        locale = request.data.get('locale') or 'en'
        data = OrderSerializer(order, context=self.get_serializer_context()).data
        try:
            result = get_provider().create_checkout(order, locale)
        except PaymentProviderError:
            data['checkout_url'] = None
            data['payment_available'] = False
            return Response(data, status=status.HTTP_201_CREATED)
        order.payment_provider = result.provider
        order.payment_session_id = result.session_id
        order.save(update_fields=['payment_provider', 'payment_session_id', 'updated_at'])
        data['checkout_url'] = result.checkout_url
        data['payment_provider'] = result.provider
        data['payment_available'] = True
        return Response(data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(
            models.Q(buyer=user) | models.Q(service__provider=user)
        ).select_related('buyer', 'service')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def order_checkout(request, pk):
    order = generics.get_object_or_404(Order, pk=pk, buyer=request.user)
    if order.payment_status == Order.PaymentStatus.PAID:
        return Response({'error': 'Order already paid'}, status=status.HTTP_400_BAD_REQUEST)
    if order.status == Order.Status.CANCELLED:
        return Response({'error': 'Order cancelled'}, status=status.HTTP_400_BAD_REQUEST)
    locale = request.query_params.get('locale') or 'en'
    try:
        result = get_provider().create_checkout(order, locale)
    except PaymentProviderError:
        return Response(
            {'checkout_url': None, 'payment_available': False, 'payment_message': 'Payments are not configured yet'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    order.payment_provider = result.provider
    order.payment_session_id = result.session_id
    order.save(update_fields=['payment_provider', 'payment_session_id', 'updated_at'])
    return Response({'checkout_url': result.checkout_url, 'payment_provider': result.provider, 'payment_available': True})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
@throttle_classes([])
def payment_webhook(request, provider='stripe'):
    try:
        payment_provider = get_provider(provider)
    except PaymentProviderError:
        return Response({'error': 'Provider not configured'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        payment_provider.handle_webhook(request)
    except PaymentWebhookError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_order(request, pk):
    order = generics.get_object_or_404(Order, pk=pk, service__provider=request.user)
    if order.status != Order.Status.IN_PROGRESS:
        return Response({'error': 'Order must be in progress to complete'}, status=status.HTTP_400_BAD_REQUEST)
    order.status = Order.Status.COMPLETED
    order.completed_at = timezone.now()
    order.save(update_fields=['status', 'completed_at'])
    order.service.sales_count += 1
    order.service.save(update_fields=['sales_count'])
    PointsManager.award_points(request.user, 'order_completed')
    from apps.notifications.services import notify
    notify(
        order.buyer,
        type='order',
        title={'ar': 'تم إكمال الطلب', 'en': 'Order completed'},
        body={
            'ar': f"تم إكمال طلبك على الخدمة: {order.service.title.get('ar') or order.service.title.get('en', '')}",
            'en': f"Your order was completed: {order.service.title.get('en') or order.service.title.get('ar', '')}",
        },
        link='/marketplace/orders/',
        icon='🎉',
    )
    return Response(OrderSerializer(order).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request, pk):
    order = generics.get_object_or_404(Order, pk=pk)
    if order.buyer != request.user and order.service.provider != request.user:
        return Response({'error': 'Not your order'}, status=status.HTTP_403_FORBIDDEN)
    if order.status in (Order.Status.COMPLETED, Order.Status.CANCELLED, Order.Status.REFUNDED):
        return Response({'error': 'Cannot cancel in current status'}, status=status.HTTP_400_BAD_REQUEST)
    order.status = Order.Status.CANCELLED
    order.save(update_fields=['status'])
    from apps.notifications.services import notify
    other_party = order.service.provider if order.buyer == request.user else order.buyer
    notify(
        other_party,
        type='order',
        title={'ar': 'تم إلغاء الطلب', 'en': 'Order cancelled'},
        body={
            'ar': f"تم إلغاء الطلب على الخدمة: {order.service.title.get('ar') or order.service.title.get('en', '')}",
            'en': f"Order cancelled for: {order.service.title.get('en') or order.service.title.get('ar', '')}",
        },
        link='/marketplace/orders/',
        icon='❌',
    )
    return Response(OrderSerializer(order).data)


# --- Reviews ---

class ReviewListView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.select_related('reviewer', 'service').all()
        service = self.request.query_params.get('service')
        if service:
            qs = qs.filter(service_id=service)
        if self.request.method == 'GET':
            qs = qs.filter(is_approved=True)
        return qs

    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        from apps.notifications.services import notify
        notify(
            review.service.provider,
            type='review',
            title={'ar': 'مراجعة جديدة', 'en': 'New review'},
            body={
                'ar': f"تلقيت تقييماً جديداً ({review.rating}★) على خدمتك",
                'en': f"You received a new review ({review.rating}★) on your service",
            },
            link='/marketplace/orders/?role=provider',
            icon='⭐',
        )


# --- Admin: Categories ---

class AdminServiceCategoryListCreateView(generics.ListCreateAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsMarketplaceAdmin]
    pagination_class = None


class AdminServiceCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsMarketplaceAdmin]


# --- Admin: Services ---

class AdminServiceListView(generics.ListCreateAPIView):
    serializer_class = AdminServiceSerializer
    permission_classes = [IsMarketplaceAdmin]

    def get_queryset(self):
        qs = Service.objects.select_related('provider', 'category').all()
        status_filter = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        service_type = self.request.query_params.get('service_type')
        search = self.request.query_params.get('search')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if category:
            qs = qs.filter(category_id=category)
        if service_type:
            qs = qs.filter(service_type=service_type)
        if search:
            qs = qs.filter(title__icontains=search)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class AdminServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Service.objects.select_related('provider', 'category').all()
    serializer_class = AdminServiceSerializer
    permission_classes = [IsMarketplaceAdmin]


# --- Admin: Orders ---

class AdminOrderListView(generics.ListAPIView):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsMarketplaceAdmin]

    def get_queryset(self):
        qs = Order.objects.select_related('buyer', 'service', 'service__provider').all()
        order_status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if order_status:
            qs = qs.filter(status=order_status)
        if search:
            qs = qs.filter(
                models.Q(buyer__email__icontains=search)
                | models.Q(buyer__name_ar__icontains=search)
                | models.Q(buyer__name_en__icontains=search)
                | models.Q(service__title__icontains=search)
            )
        return qs.order_by('-created_at')


class AdminOrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminOrderSerializer
    permission_classes = [IsMarketplaceAdmin]

    def get_queryset(self):
        return Order.objects.select_related('buyer', 'service', 'service__provider').all()

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in Order.Status.values:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        if new_status == Order.Status.COMPLETED and not order.completed_at:
            order.completed_at = timezone.now()
        if new_status == Order.Status.COMPLETED:
            order.service.sales_count += 1
            order.service.save(update_fields=['sales_count'])
            PointsManager.award_points(order.service.provider, 'order_completed')
        order.save()
        return Response(AdminOrderSerializer(order).data)


# --- Admin: Reviews ---

class AdminReviewListView(generics.ListAPIView):
    serializer_class = AdminReviewSerializer
    permission_classes = [IsMarketplaceAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = Review.objects.select_related('reviewer', 'service').all()
        approved = self.request.query_params.get('approved')
        service = self.request.query_params.get('service')
        if approved is not None:
            qs = qs.filter(is_approved=approved.lower() in ('1', 'true', 'yes'))
        if service:
            qs = qs.filter(service_id=service)
        return qs.order_by('-created_at')


class AdminReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Review.objects.select_related('reviewer', 'service').all()
    serializer_class = AdminReviewSerializer
    permission_classes = [IsMarketplaceAdmin]

    def perform_update(self, serializer):
        serializer.save()

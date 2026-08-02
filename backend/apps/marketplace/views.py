from django.db import models
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.gamification.services import PointsManager

from .models import Order, Review, Service, ServiceAvailability, ServiceCategory
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
        serializer.save(reviewer=self.request.user)


# --- Admin: Categories ---

class AdminServiceCategoryListCreateView(generics.ListCreateAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminServiceCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.IsAdminUser]


# --- Admin: Services ---

class AdminServiceListView(generics.ListCreateAPIView):
    serializer_class = AdminServiceSerializer
    permission_classes = [permissions.IsAdminUser]

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
    permission_classes = [permissions.IsAdminUser]


# --- Admin: Orders ---

class AdminOrderListView(generics.ListAPIView):
    serializer_class = AdminOrderSerializer
    permission_classes = [permissions.IsAdminUser]

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
    permission_classes = [permissions.IsAdminUser]

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
    permission_classes = [permissions.IsAdminUser]
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
    permission_classes = [permissions.IsAdminUser]

    def perform_update(self, serializer):
        serializer.save()

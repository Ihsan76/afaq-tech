from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.marketplace.payments import PaymentProviderError, get_provider

from .currencies import resolve_currency
from .models import Plan, PlanService, PlanServiceLimit, Subscription
from .serializers import (
    AdminPlanSerializer,
    PlanSerializer,
    PlanServiceLimitSerializer,
    PlanServiceSerializer,
    PurchaseSerializer,
    SubscriptionSerializer,
)
from .services import user_usage_summary


class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_subscription(request):
    subscriptions = Subscription.objects.filter(user=request.user).select_related('plan')
    subscription = subscriptions.filter(status=Subscription.Status.ACTIVE).first() or subscriptions.first()
    if not subscription:
        return Response({})
    return Response(SubscriptionSerializer(subscription, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def purchase_subscription(request):
    serializer = PurchaseSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    plan = serializer.validated_data['plan_id']
    locale = serializer.validated_data.get('locale') or 'en'
    display_currency = resolve_currency(request, override=serializer.validated_data.get('currency', ''))
    display_price, _ = plan.get_price(display_currency)
    subscription = Subscription.objects.create(
        user=request.user,
        plan=plan,
        price_paid=plan.price,
        currency=plan.currency,
        display_price=display_price,
        display_currency=display_currency,
    )
    data = SubscriptionSerializer(subscription, context={'request': request}).data
    try:
        result = get_provider().create_checkout(subscription, locale)
    except PaymentProviderError:
        data['checkout_url'] = None
        data['payment_available'] = False
        return Response(data, status=status.HTTP_201_CREATED)
    subscription.payment_provider = result.provider
    subscription.payment_session_id = result.session_id
    subscription.save(update_fields=['payment_provider', 'payment_session_id', 'updated_at'])
    data['checkout_url'] = result.checkout_url
    data['payment_provider'] = result.provider
    data['payment_available'] = True
    return Response(data, status=status.HTTP_201_CREATED)


class AdminPlanListCreateView(generics.ListCreateAPIView):
    queryset = Plan.objects.all()
    serializer_class = AdminPlanSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plan.objects.all()
    serializer_class = AdminPlanSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminServiceListCreateView(generics.ListCreateAPIView):
    queryset = PlanService.objects.all()
    serializer_class = PlanServiceSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class AdminServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PlanService.objects.all()
    serializer_class = PlanServiceSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminPlanServicesView(generics.RetrieveUpdateAPIView):
    """List or replace the services linked to a plan (with usage limits)."""

    queryset = Plan.objects.all()
    permission_classes = [permissions.IsAdminUser]

    def retrieve(self, request, *args, **kwargs):
        plan = self.get_object()
        rows = plan.service_limits.select_related('service').order_by('sort_order', 'id')
        return Response(PlanServiceLimitSerializer(rows, many=True, context={'request': request}).data)

    def update(self, request, *args, **kwargs):
        plan = self.get_object()
        data = request.data if isinstance(request.data, list) else request.data.get('services', [])
        if not isinstance(data, list):
            return Response({'error': 'Expected a list of services'}, status=status.HTTP_400_BAD_REQUEST)
        plan.service_limits.all().delete()
        created = []
        for index, item in enumerate(data):
            code = (item.get('code') or '').strip()
            service = PlanService.objects.filter(code=code, is_active=True).first()
            if not service:
                continue
            raw_limit = item.get('limit')
            try:
                limit = int(raw_limit) if raw_limit not in (None, '') else None
            except (TypeError, ValueError):
                limit = None
            period = item.get('period') or PlanService.Period.MONTHLY
            if period not in PlanService.Period.values:
                period = PlanService.Period.MONTHLY
            row = PlanServiceLimit.objects.create(
                plan=plan,
                service=service,
                limit=limit,
                period=period,
                sort_order=item.get('sort_order', index),
            )
            created.append(row)
        return Response(PlanServiceLimitSerializer(created, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def usage_summary(request):
    """Return the current user's service usage under their plan."""
    return Response({
        'plan': request.user.subscription_plan,
        'services': user_usage_summary(request.user),
    })

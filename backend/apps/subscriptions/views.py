from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.marketplace.payments import PaymentProviderError, get_provider

from .models import Plan, Subscription
from .serializers import (
    AdminPlanSerializer,
    PlanSerializer,
    PurchaseSerializer,
    SubscriptionSerializer,
)


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
    subscription = Subscription.objects.create(
        user=request.user,
        plan=plan,
        price_paid=plan.price,
        currency=plan.currency,
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

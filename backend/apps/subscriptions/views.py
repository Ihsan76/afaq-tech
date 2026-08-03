from django.conf import settings
from rest_framework import generics, permissions, serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.marketplace.payments import PaymentProviderError, get_provider

from .currencies import resolve_currency
from .models import (
    Organization,
    OrganizationMembership,
    Plan,
    PlanService,
    PlanServiceLimit,
    SeatPurchase,
    Subscription,
)
from .serializers import (
    AdminOrganizationSerializer,
    AdminPlanSerializer,
    OrganizationMemberSerializer,
    OrganizationSerializer,
    PlanSerializer,
    PlanServiceLimitSerializer,
    PlanServiceSerializer,
    PurchaseSerializer,
    SeatPurchaseSerializer,
    SubscriptionSerializer,
)
from .services import (
    accept_invite,
    invite_teacher,
    manager_organization,
    user_usage_summary,
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
    """Return the current user's service usage under their plan (org-aware)."""
    return Response({
        'plan': request.user.subscription_plan,
        'services': user_usage_summary(request.user),
    })


def _manager_org_or_403(request):
    org = manager_organization(request.user)
    if org is None:
        return None
    if org.status != Organization.Status.ACTIVE:
        return None
    return org


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def my_organization(request):
    """Manager's organization overview: plan, seats and members."""
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'PATCH':
        name = (request.data.get('name') or '').strip()
        if name:
            org.name = name
            org.save(update_fields=['name', 'updated_at'])
    data = OrganizationSerializer(org, context={'request': request}).data
    members = org.memberships.select_related('user').order_by('created_at')
    data['members'] = OrganizationMemberSerializer(members, many=True, context={'request': request}).data
    data['usage'] = user_usage_summary(request.user)
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def invite_teacher_view(request):
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    email = (request.data.get('email') or '').strip().lower()
    if not email or '@' not in email:
        return Response({'error': 'invalid_email'}, status=status.HTTP_400_BAD_REQUEST)
    if org.occupied_seats() >= org.total_seats():
        return Response({'error': 'seats_limit_reached', 'total_seats': org.total_seats()},
                        status=status.HTTP_400_BAD_REQUEST)
    role = request.data.get('role') or OrganizationMembership.Role.TEACHER
    if role not in OrganizationMembership.Role.values:
        role = OrganizationMembership.Role.TEACHER
    try:
        membership, created = invite_teacher(org, email, request.user, role)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    locale = request.data.get('locale') or getattr(request, 'LANGUAGE_CODE', 'ar') or 'ar'
    token = membership.invite_token
    invite_url = f"{settings.FRONTEND_URL}/{locale}/join-organization?token={token}"
    try:
        from apps.core.email import organization_invite_email, send_email
        send_email(
            email,
            'دعوة للانضمام إلى Afaq Tech' if locale == 'ar' else 'Invitation to join Afaq Tech',
            organization_invite_email(org.name, invite_url, locale, membership.role),
        )
    except Exception:
        pass
    data = OrganizationMemberSerializer(membership, context={'request': request}).data
    data['invite_url'] = invite_url
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cancel_invite(request, token):
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    membership = org.memberships.filter(invite_token=token, status=OrganizationMembership.Status.PENDING).first()
    if not membership:
        return Response({'error': 'invite_not_found'}, status=status.HTTP_404_NOT_FOUND)
    membership.status = OrganizationMembership.Status.REMOVED
    membership.save(update_fields=['status', 'updated_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def remove_member(request, member_id):
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    membership = org.memberships.filter(pk=member_id, status=OrganizationMembership.Status.ACTIVE).first()
    if not membership:
        return Response({'error': 'member_not_found'}, status=status.HTTP_404_NOT_FOUND)
    if membership.user_id == org.owner_id:
        return Response({'error': 'cannot_remove_owner'}, status=status.HTTP_400_BAD_REQUEST)
    membership.status = OrganizationMembership.Status.REMOVED
    membership.user = None
    membership.save(update_fields=['status', 'user', 'updated_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def set_member_role(request, member_id):
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    role = request.data.get('role') or ''
    if role not in OrganizationMembership.Role.values:
        return Response({'error': 'invalid_role'}, status=status.HTTP_400_BAD_REQUEST)
    membership = org.memberships.filter(pk=member_id, status=OrganizationMembership.Status.ACTIVE).first()
    if not membership:
        return Response({'error': 'member_not_found'}, status=status.HTTP_404_NOT_FOUND)
    membership.role = role
    membership.save(update_fields=['role', 'updated_at'])
    return Response(OrganizationMemberSerializer(membership, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def org_invite_info(request, token):
    membership = OrganizationMembership.objects.select_related('organization').filter(
        invite_token=token, status=OrganizationMembership.Status.PENDING
    ).first()
    if not membership:
        return Response({'error': 'invite_not_found'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'org_name': membership.organization.name,
        'email': membership.invite_email,
        'role': membership.role,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_org_invite(request, token):
    try:
        membership = accept_invite(token, request.user)
    except ValueError as exc:
        message = str(exc)
        if message in ('invite_not_found', 'organization_suspended', 'already_in_organization', 'email_mismatch'):
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        raise
    return Response(OrganizationMemberSerializer(membership, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def extra_seats_purchase(request):
    org = _manager_org_or_403(request)
    if org is None:
        return Response({'error': 'organization_not_available'}, status=status.HTTP_403_FORBIDDEN)
    serializer = SeatPurchaseSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    count = serializer.validated_data['count']
    locale = serializer.validated_data.get('locale') or 'en'
    plan = org.plan
    if plan.extra_seat_price <= 0:
        return Response({'error': 'extra_seats_unavailable'}, status=status.HTTP_400_BAD_REQUEST)
    price = plan.extra_seat_price * count
    seat = SeatPurchase.objects.create(
        organization=org,
        user=request.user,
        count=count,
        price_paid=price,
        currency=plan.currency,
        title=f"{org.name} — {count} extra seats",
    )
    data = {'id': seat.id, 'count': seat.count, 'price_paid': str(seat.price_paid), 'currency': seat.currency}
    try:
        result = get_provider().create_checkout(seat, locale)
    except PaymentProviderError:
        data['checkout_url'] = None
        data['payment_available'] = False
        return Response(data, status=status.HTTP_201_CREATED)
    seat.payment_provider = result.provider
    seat.payment_session_id = result.session_id
    seat.save(update_fields=['payment_provider', 'payment_session_id', 'updated_at'])
    data['checkout_url'] = result.checkout_url
    data['payment_provider'] = result.provider
    data['payment_available'] = True
    return Response(data, status=status.HTTP_201_CREATED)


class AdminOrganizationListCreateView(generics.ListCreateAPIView):
    queryset = Organization.objects.select_related('owner', 'plan').all()
    serializer_class = AdminOrganizationSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def perform_create(self, serializer):
        from django.contrib.auth import get_user_model
        owner_email = self.request.data.get('owner_email') or ''
        User = get_user_model()
        owner = User.objects.filter(email__iexact=owner_email.strip()).first()
        if not owner:
            raise serializers.ValidationError({'owner_email': 'User not found'})
        serializer.save(owner=owner)


class AdminOrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.select_related('owner', 'plan').all()
    serializer_class = AdminOrganizationSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def admin_organization_members(request, pk):
    org = generics.get_object_or_404(Organization, pk=pk)
    members = org.memberships.select_related('user').order_by('created_at')
    return Response(OrganizationMemberSerializer(members, many=True, context={'request': request}).data)

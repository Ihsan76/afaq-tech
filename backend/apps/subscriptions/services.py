import secrets
from datetime import timedelta

from django.db.models import F
from django.utils import timezone

from .models import (
    Organization,
    OrganizationMembership,
    Plan,
    SeatPurchase,
    ServiceUsage,
    Subscription,
)

ORGANIZATION_PLAN_CODES = ('school', 'enterprise')


def activate_subscription(subscription_id, transaction_id='', provider_name=''):
    """Idempotently activate a subscription and upgrade the user's plan."""
    try:
        subscription = Subscription.objects.select_related('plan', 'user').get(id=subscription_id)
    except (Subscription.DoesNotExist, ValueError, TypeError):
        return False
    if subscription.status == Subscription.Status.ACTIVE and subscription.paid_at:
        return True
    now = timezone.now()
    subscription.status = Subscription.Status.ACTIVE
    subscription.payment_transaction_id = transaction_id or subscription.payment_transaction_id
    subscription.payment_provider = provider_name or subscription.payment_provider
    subscription.start_at = now
    subscription.end_at = now + timedelta(days=subscription.plan.duration_days)
    subscription.paid_at = now
    subscription.save(update_fields=[
        'status',
        'payment_transaction_id',
        'payment_provider',
        'start_at',
        'end_at',
        'paid_at',
        'updated_at',
    ])
    user = subscription.user
    if user.subscription_plan != subscription.plan.code:
        user.subscription_plan = subscription.plan.code
        user.save(update_fields=['subscription_plan'])
    if subscription.plan.code in ORGANIZATION_PLAN_CODES:
        ensure_organization(user, subscription)
    from apps.notifications.services import notify
    plan_name = (subscription.plan.name or {}).get('ar') or subscription.plan.code
    notify(
        user,
        type='payment',
        title={'ar': 'تم تفعيل الباقة', 'en': 'Plan activated'},
        body={
            'ar': f"تم تفعيل اشتراكك في باقة: {plan_name}",
            'en': f"Your {subscription.plan.code} plan is now active",
        },
        link='/subscriptions',
        icon='💳',
    )
    return True


def ensure_organization(user, subscription=None):
    """Create (or update) the school/institution organization owned by the user."""
    org = Organization.objects.select_related('plan').filter(owner=user).first()
    plan = subscription.plan if subscription else get_user_plan(user)
    if org is None:
        name = user.translations.get('ar', {}).get('name') or user.email
        org = Organization.objects.create(
            name=name,
            owner=user,
            plan=plan,
            subscription=subscription,
        )
    elif plan and (org.plan_id != plan.id or (subscription and org.subscription_id != subscription.id)):
        updates = {'plan': plan}
        if subscription:
            updates['subscription'] = subscription
        Organization.objects.filter(pk=org.pk).update(**updates, updated_at=timezone.now())
        org.refresh_from_db()
    return org


def get_user_plan(user):
    """Resolve the user's plan: their organization's plan if they belong to an active one, else their own."""
    org = get_org_for_user(user)
    if org and org.plan_id:
        return org.plan
    code = getattr(user, 'subscription_plan', '') or 'free'
    return Plan.objects.filter(code=code).first()


def get_org_for_user(user):
    """The active organization the user belongs to (member or owner), or None."""
    membership = (
        OrganizationMembership.objects
        .filter(
            user=user,
            status=OrganizationMembership.Status.ACTIVE,
            organization__status=Organization.Status.ACTIVE,
        )
        .select_related('organization', 'organization__plan')
        .first()
    )
    if membership:
        return membership.organization
    return (
        Organization.objects
        .select_related('plan')
        .filter(owner=user, status=Organization.Status.ACTIVE)
        .first()
    )


def usage_subject(user):
    """Usage is charged to the organization (shared pool) when the user belongs to one."""
    return get_org_for_user(user) or user


def _resolve_subject(subject):
    """Normalize a usage subject to an organization when the user belongs to one."""
    if isinstance(subject, Organization):
        return subject
    return get_org_for_user(subject) or subject


def usage_period_key(period, now=None):
    """Build the period bucket key for a usage record."""
    now = now or timezone.now()
    if period == 'daily':
        return now.strftime('%Y-%m-%d')
    if period == 'monthly':
        return now.strftime('%Y-%m')
    if period == 'yearly':
        return now.strftime('%Y')
    return 'all'


def _usage_record(subject, service, period_key):
    if isinstance(subject, Organization):
        return ServiceUsage.objects.filter(
            organization=subject, service=service, period_key=period_key
        ).first()
    return ServiceUsage.objects.filter(user=subject, service=service, period_key=period_key).first()


def _get_limit_row(plan, service_code):
    if not plan:
        return None
    return (
        plan.service_limits
        .select_related('service')
        .filter(service__code=service_code, service__is_active=True)
        .first()
    )


def current_usage(subject, service_code, plan=None):
    """Return (used, limit, period) for a service under a user's or organization's plan.

    limit is None when the plan grants unlimited use (no limit row configured).
    """
    subject = _resolve_subject(subject)
    plan = plan or (subject.plan if isinstance(subject, Organization) else get_user_plan(subject))
    row = _get_limit_row(plan, service_code)
    if row:
        key = usage_period_key(row.period)
        usage = _usage_record(subject, row.service, key)
        return (usage.used_count if usage else 0), row.limit, row.period
    return 0, None, ''


def usage_allowed(subject, service_code):
    """Check whether a user/organization may use a service under their plan limits."""
    used, limit, _ = current_usage(subject, service_code)
    if limit is None:
        return True, used, None
    return used < limit, used, limit


def record_usage(subject, service_code, amount=1):
    """Atomically count a service usage for the subject's current plan period.

    A user who belongs to an organization shares the organization's usage pool.
    """
    subject = _resolve_subject(subject)
    plan = subject.plan if isinstance(subject, Organization) else get_user_plan(subject)
    row = _get_limit_row(plan, service_code)
    if not row:
        return None
    key = usage_period_key(row.period)
    if isinstance(subject, Organization):
        usage, _ = ServiceUsage.objects.get_or_create(
            organization=subject, service=row.service, period_key=key, defaults={'used_count': 0},
        )
    else:
        usage, _ = ServiceUsage.objects.get_or_create(
            user=subject, service=row.service, period_key=key, defaults={'used_count': 0},
        )
    ServiceUsage.objects.filter(pk=usage.pk).update(used_count=F('used_count') + amount)
    usage.refresh_from_db()
    return usage.used_count


def user_usage_summary(user):
    """Summarize usage per service under the subject's current plan (org-aware)."""
    subject = usage_subject(user)
    plan = subject.plan if isinstance(subject, Organization) else get_user_plan(user)
    rows = []
    if plan:
        for row in plan.service_limits.select_related('service').order_by('sort_order', 'id'):
            if not row.service.is_active:
                continue
            key = usage_period_key(row.period)
            usage = _usage_record(subject, row.service, key)
            rows.append({
                'code': row.service.code,
                'name': row.service.name,
                'period': row.period,
                'limit': row.limit,
                'used': usage.used_count if usage else 0,
            })
    return rows


def manager_organization(user):
    """The organization the user manages: owned (school/enterprise plan) or via an active MANAGER membership."""
    if user.subscription_plan in ORGANIZATION_PLAN_CODES:
        return ensure_organization(user)
    membership = (
        OrganizationMembership.objects
        .select_related('organization__plan')
        .filter(
            user=user,
            role=OrganizationMembership.Role.MANAGER,
            status=OrganizationMembership.Status.ACTIVE,
            organization__status=Organization.Status.ACTIVE,
        )
        .first()
    )
    return membership.organization if membership else None


def invite_teacher(org, email, inviter, role=OrganizationMembership.Role.TEACHER):
    """Create a pending invite for a teacher email. Returns (membership, created)."""
    email = (email or '').strip().lower()
    existing_active = org.memberships.filter(
        invite_email=email, status=OrganizationMembership.Status.ACTIVE
    ).first()
    if existing_active:
        raise ValueError('already_member')

    pending = org.memberships.filter(invite_email=email, status=OrganizationMembership.Status.PENDING).first()
    if pending:
        pending.invite_token = secrets.token_urlsafe(32)
        pending.role = role
        pending.invited_by = inviter
        pending.invited_at = timezone.now()
        pending.save(update_fields=['invite_token', 'role', 'invited_by', 'invited_at', 'updated_at'])
        return pending, False

    membership = OrganizationMembership.objects.create(
        organization=org,
        role=role,
        status=OrganizationMembership.Status.PENDING,
        invite_email=email,
        invite_token=secrets.token_urlsafe(32),
        invited_by=inviter,
        invited_at=timezone.now(),
    )
    return membership, True


def accept_invite(token, user):
    """Accept a pending invite as an active membership for the matching user."""
    membership = (
        OrganizationMembership.objects
        .select_related('organization')
        .filter(invite_token=token, status=OrganizationMembership.Status.PENDING)
        .first()
    )
    if not membership:
        raise ValueError('invite_not_found')
    if membership.invite_email.lower() != (user.email or '').lower():
        raise ValueError('email_mismatch')
    org = membership.organization
    if org.status != Organization.Status.ACTIVE:
        raise ValueError('organization_suspended')
    other_active = (
        OrganizationMembership.objects
        .filter(user=user, status=OrganizationMembership.Status.ACTIVE)
        .exclude(pk=membership.pk)
        .exists()
    )
    if other_active:
        raise ValueError('already_in_organization')
    membership.user = user
    membership.status = OrganizationMembership.Status.ACTIVE
    membership.joined_at = timezone.now()
    membership.save(update_fields=['user', 'status', 'joined_at', 'updated_at'])
    return membership


def confirm_seat_purchase(seat_purchase_id, transaction_id='', provider_name=''):
    """Idempotently mark a seat purchase as paid and add the extra seats."""
    try:
        seat = SeatPurchase.objects.select_related('organization').get(id=seat_purchase_id)
    except (SeatPurchase.DoesNotExist, ValueError, TypeError):
        return False
    if seat.status == SeatPurchase.Status.PAID and seat.paid_at:
        return True
    seat.status = SeatPurchase.Status.PAID
    seat.payment_transaction_id = transaction_id or seat.payment_transaction_id
    seat.payment_provider = provider_name or seat.payment_provider
    seat.paid_at = timezone.now()
    seat.save(update_fields=['status', 'payment_transaction_id', 'payment_provider', 'paid_at', 'updated_at'])
    org = seat.organization
    if org:
        Organization.objects.filter(pk=org.pk).update(extra_seats=F('extra_seats') + seat.count)
    return True

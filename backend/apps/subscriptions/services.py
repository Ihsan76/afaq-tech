from datetime import timedelta

from django.db.models import F
from django.utils import timezone

from .models import Plan, ServiceUsage, Subscription


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
    return True


def get_user_plan(user):
    """Resolve the user's current plan by their subscription_plan code."""
    code = getattr(user, 'subscription_plan', '') or 'free'
    return Plan.objects.filter(code=code).first()


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


def current_usage(user, service_code, plan=None):
    """Return (used, limit, period) for a service under the user's plan.

    limit is None when the plan grants unlimited use (no limit row configured).
    """
    plan = plan or get_user_plan(user)
    if plan:
        row = (
            plan.service_limits
            .select_related('service')
            .filter(service__code=service_code, service__is_active=True)
            .first()
        )
        if row:
            key = usage_period_key(row.period)
            usage = ServiceUsage.objects.filter(user=user, service=row.service, period_key=key).first()
            return (usage.used_count if usage else 0), row.limit, row.period
    return 0, None, ''


def usage_allowed(user, service_code):
    """Check whether a user may use a service under their plan limits."""
    used, limit, _ = current_usage(user, service_code)
    if limit is None:
        return True, used, None
    return used < limit, used, limit


def record_usage(user, service_code, amount=1):
    """Atomically count a service usage for the user's current plan period."""
    plan = get_user_plan(user)
    if not plan:
        return None
    row = (
        plan.service_limits
        .select_related('service')
        .filter(service__code=service_code, service__is_active=True)
        .first()
    )
    if not row:
        return None
    key = usage_period_key(row.period)
    usage, _ = ServiceUsage.objects.get_or_create(
        user=user, service=row.service, period_key=key, defaults={'used_count': 0},
    )
    ServiceUsage.objects.filter(pk=usage.pk).update(used_count=F('used_count') + amount)
    usage.refresh_from_db()
    return usage.used_count


def user_usage_summary(user):
    """Summarize usage per service under the user's current plan."""
    plan = get_user_plan(user)
    rows = []
    if plan:
        for row in plan.service_limits.select_related('service').order_by('sort_order', 'id'):
            if not row.service.is_active:
                continue
            key = usage_period_key(row.period)
            usage = ServiceUsage.objects.filter(user=user, service=row.service, period_key=key).first()
            rows.append({
                'code': row.service.code,
                'name': row.service.name,
                'period': row.period,
                'limit': row.limit,
                'used': usage.used_count if usage else 0,
            })
    return rows

from datetime import timedelta

from django.utils import timezone

from .models import Subscription


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

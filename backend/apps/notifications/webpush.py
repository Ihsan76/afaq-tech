import contextlib

from django.conf import settings

try:
    from pywebpush import WebPushException, webpush
    PYWEBPUSH_AVAILABLE = True
except ImportError:
    PYWEBPUSH_AVAILABLE = False


def normalize_vapid_key(key: str) -> str:
    """Browser PushManager expects a base64url key without trailing padding."""
    if not key:
        return ''
    return key.rstrip('=')


def vapid_configured() -> bool:
    return bool(
        PYWEBPUSH_AVAILABLE
        and settings.VAPID_PUBLIC_KEY
        and settings.VAPID_PRIVATE_KEY
    )


def get_public_key() -> str:
    return normalize_vapid_key(settings.VAPID_PUBLIC_KEY) if vapid_configured() else ''


def _send_to_subscription(subscription, payload: dict) -> bool:
    if not vapid_configured():
        return False
    try:
        webpush(
            subscription_info={
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth,
                },
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': settings.VAPID_SUBJECT},
            ttl=3600,
        )
        return True
    except WebPushException as exc:
        # 404/410 → subscription expired, drop it.
        if getattr(exc, 'response', None) is not None and exc.response.status_code in (404, 410):
            with contextlib.suppress(Exception):
                subscription.delete()
        return False
    except Exception:
        return False


def send_web_push(user, title: str, body: str, url: str = '', icon: str = '') -> int:
    """Attempt to deliver a browser push to all of the user's subscriptions.

    Never raises: delivery is best-effort (missing VAPID keys, network errors,
    or expired subscriptions are all swallowed).
    """
    from .models import PushSubscription

    if not vapid_configured():
        return 0
    subs = list(PushSubscription.objects.filter(user=user))
    payload = {'title': title, 'body': body, 'url': url, 'icon': icon}
    sent = 0
    for sub in subs:
        if _send_to_subscription(sub, payload):
            sent += 1
    return sent


def localized_text(mapping: dict, locale: str, field: str = 'title', fallback: str = '') -> str:
    if not mapping or not isinstance(mapping, dict):
        return fallback
    # Flat multilingual dicts: {'ar': 'مرحباً', 'en': 'Hello'}
    for key in (locale, 'en', 'ar'):
        value = mapping.get(key)
        if isinstance(value, str) and value:
            return value
    # Nested dicts: {'ar': {'title': '...'}}
    for key in (locale, 'en', 'ar'):
        value = mapping.get(key)
        if isinstance(value, dict):
            text = value.get(field)
            if isinstance(text, str) and text:
                return text
    return fallback

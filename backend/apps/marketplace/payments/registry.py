from django.conf import settings

from .base import PaymentNotConfiguredError
from .myfatoorah_provider import MyFatoorahProvider
from .stripe_provider import StripeProvider

PROVIDER_CLASSES = {
    'stripe': StripeProvider,
    'myfatoorah': MyFatoorahProvider,
}

# Priority order used in "auto" mode.
AUTO_PRIORITY = ('stripe', 'myfatoorah')


def get_provider(name=None):
    """Resolve the active payment provider.

    Uses settings.PAYMENT_PROVIDER (one of stripe|myfatoorah|auto). In "auto"
    mode the first configured provider wins, following AUTO_PRIORITY.
    """
    requested = name or getattr(settings, 'PAYMENT_PROVIDER', 'auto')
    if requested != 'auto':
        cls = PROVIDER_CLASSES.get(requested)
        if cls is None:
            raise PaymentNotConfiguredError(f"Unknown payment provider: {requested}")
        provider = cls()
        if provider.is_configured():
            return provider
        raise PaymentNotConfiguredError(f"{requested} is not configured")

    for key in AUTO_PRIORITY:
        provider = PROVIDER_CLASSES[key]()
        if provider.is_configured():
            return provider
    raise PaymentNotConfiguredError('No payment provider is configured')

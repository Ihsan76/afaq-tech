from abc import ABC, abstractmethod
from dataclasses import dataclass

from django.utils import timezone

from ..models import Order


def checkout_locale_title(checkout, locale='en'):
    """Best-effort localized line-item title for an order or subscription checkout."""
    title = getattr(checkout, 'title', None)
    if title:
        if isinstance(title, dict):
            for key in (locale, 'en', 'ar'):
                if title.get(key):
                    return title[key]
            title = None
        elif title is not None:
            return title
    service = getattr(checkout, 'service', None)
    if service is not None:
        title = service.title
    elif getattr(checkout, 'plan', None) is not None:
        title = checkout.plan.name
    if isinstance(title, dict):
        for key in (locale, 'en', 'ar'):
            if title.get(key):
                return title[key]
    return title or f"#{checkout.id}"


def checkout_buyer(checkout):
    """The purchasing user for an order or subscription checkout."""
    return getattr(checkout, 'buyer', None) or getattr(checkout, 'user', None)


def checkout_return_path(checkout, locale='en'):
    """Frontend path where the buyer returns after the hosted checkout."""
    kind = getattr(checkout, 'kind', 'order')
    if kind == 'subscription':
        return 'subscriptions'
    if kind == 'seat_purchase':
        return 'organization'
    return 'marketplace/orders'


def parse_checkout_id(raw):
    """Parse a `kind:id` reference (or a legacy raw id) into (kind, id)."""
    if isinstance(raw, str) and ':' in raw:
        prefix, _, rest = raw.partition(':')
        if prefix in ('order', 'subscription', 'seat_purchase') and rest:
            return prefix, rest
    return 'order', raw


class PaymentProviderError(Exception):
    """Raised when a payment provider cannot complete an operation."""


class PaymentNotConfiguredError(PaymentProviderError):
    """Raised when the requested provider is missing its API credentials."""


class PaymentWebhookError(Exception):
    """Raised when an incoming webhook cannot be verified or parsed."""


@dataclass
class PaymentCheckoutResult:
    provider: str
    checkout_url: str
    session_id: str


class PaymentProvider(ABC):
    name = ""

    @abstractmethod
    def is_configured(self) -> bool:
        """Whether the provider has its API credentials configured."""

    @abstractmethod
    def create_checkout(self, order, locale="en") -> PaymentCheckoutResult:
        """Create a hosted checkout for an order and return the redirect target."""

    @abstractmethod
    def handle_webhook(self, request) -> bool:
        """Verify and process an incoming webhook. Returns True when an order was handled."""

    def mark_order_paid(self, order_id, transaction_id=""):
        """Idempotently mark an order as paid/confirmed. Returns True when matched."""
        try:
            order = Order.objects.get(id=order_id)
        except (Order.DoesNotExist, ValueError, TypeError):
            return False
        if order.payment_status == Order.PaymentStatus.PAID:
            return True
        order.payment_status = Order.PaymentStatus.PAID
        order.payment_transaction_id = transaction_id or order.payment_transaction_id
        order.payment_provider = self.name
        order.paid_at = timezone.now()
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=[
            'payment_status',
            'payment_transaction_id',
            'payment_provider',
            'paid_at',
            'status',
            'updated_at',
        ])
        return True

    def mark_paid(self, kind, checkout_id, transaction_id=""):
        """Dispatch a successful payment to the right model by checkout kind."""
        if kind == 'subscription':
            from apps.subscriptions.services import activate_subscription
            return activate_subscription(checkout_id, transaction_id, provider_name=self.name)
        if kind == 'seat_purchase':
            from apps.subscriptions.services import confirm_seat_purchase
            return confirm_seat_purchase(checkout_id, transaction_id, provider_name=self.name)
        return self.mark_order_paid(checkout_id, transaction_id)

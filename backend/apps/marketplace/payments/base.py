from abc import ABC, abstractmethod
from dataclasses import dataclass

from django.utils import timezone

from ..models import Order


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

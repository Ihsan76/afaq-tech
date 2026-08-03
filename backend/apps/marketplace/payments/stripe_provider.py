from decimal import Decimal

import stripe
from django.conf import settings

from .base import (
    PaymentCheckoutResult,
    PaymentNotConfiguredError,
    PaymentProvider,
    PaymentWebhookError,
    checkout_buyer,
    checkout_locale_title,
    checkout_return_path,
)


class StripeProvider(PaymentProvider):
    name = "stripe"

    def is_configured(self):
        return bool(getattr(settings, 'STRIPE_SECRET_KEY', ''))

    def create_checkout(self, order, locale='en'):
        if not self.is_configured():
            raise PaymentNotConfiguredError('Stripe is not configured')
        stripe.api_key = settings.STRIPE_SECRET_KEY
        kind = getattr(order, 'kind', 'order')
        title = checkout_locale_title(order, locale)
        return_path = checkout_return_path(order, locale)
        metadata = {'kind': kind, 'checkout_id': str(order.id)}
        if kind == 'order':
            metadata['order_id'] = str(order.id)
        session = stripe.checkout.Session.create(
            mode='payment',
            line_items=[{
                'price_data': {
                    'currency': (order.currency or 'SAR').lower(),
                    'unit_amount': int(Decimal(order.price_paid) * 100),
                    'product_data': {'name': title},
                },
                'quantity': 1,
            }],
            metadata=metadata,
            client_reference_id=str(order.id),
            customer_email=checkout_buyer(order).email,
            success_url=f"{settings.FRONTEND_URL}/{locale}/{return_path}/?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/{locale}/{return_path}/?cancelled=1",
        )
        return PaymentCheckoutResult(provider=self.name, checkout_url=session.url, session_id=session.id)

    def handle_webhook(self, request):
        webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
        if not webhook_secret:
            raise PaymentWebhookError('Webhook not configured')
        try:
            event = stripe.Webhook.construct_event(
                request.body,
                request.headers.get('Stripe-Signature'),
                webhook_secret,
            )
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            raise PaymentWebhookError('Invalid signature') from exc
        if event['type'] != 'checkout.session.completed':
            return False
        session = event['data']['object']
        metadata = session.get('metadata', {}) or {}
        kind = metadata.get('kind') or 'order'
        checkout_id = (
            metadata.get('checkout_id')
            or metadata.get('order_id')
            or session.get('client_reference_id')
        )
        if not checkout_id:
            return False
        return self.mark_paid(kind, checkout_id, session.get('payment_intent') or '')

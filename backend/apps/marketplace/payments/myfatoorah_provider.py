import base64
import hashlib
import hmac
import json

import requests
from django.conf import settings

from apps.core.translations import get_translation

from .base import (
    PaymentCheckoutResult,
    PaymentNotConfiguredError,
    PaymentProvider,
    PaymentWebhookError,
)


class MyFatoorahProvider(PaymentProvider):
    name = "myfatoorah"

    DEFAULT_BASE_URL = "https://apitest.myfatoorah.com"
    # 0 = hosted invoice page listing all payment methods enabled on the account.
    DEFAULT_PAYMENT_METHOD_ID = 0

    def is_configured(self):
        return bool(getattr(settings, 'MYFATOORAH_API_TOKEN', ''))

    def _base_url(self):
        return (getattr(settings, 'MYFATOORAH_BASE_URL', '') or self.DEFAULT_BASE_URL).rstrip('/')

    def _token(self):
        return getattr(settings, 'MYFATOORAH_API_TOKEN', '')

    def create_checkout(self, order, locale='en'):
        if not self.is_configured():
            raise PaymentNotConfiguredError('MyFatoorah is not configured')
        callback = f"{settings.FRONTEND_URL}/{locale}/marketplace/orders/?provider=myfatoorah"
        payload = {
            'PaymentMethodId': int(getattr(settings, 'MYFATOORAH_PAYMENT_METHOD_ID', 0) or 0),
            'InvoiceValue': float(order.price_paid),
            'DisplayCurrencyIso': (order.currency or 'SAR').upper(),
            'CallBackUrl': callback,
            'ErrorUrl': f"{callback}&cancelled=1",
            'Language': 'AR' if str(locale).lower().startswith('ar') else 'EN',
            'CustomerName': get_translation(order.buyer.translations, 'en', 'name', order.buyer.email),
            'CustomerEmail': order.buyer.email,
            'CustomerReference': str(order.id),
            'UserDefinedField': str(order.id),
            'InvoiceItems': [{
                'ItemName': (
                    order.service.title.get(locale)
                    or order.service.title.get('en')
                    or order.service.title.get('ar')
                    or f'Service #{order.service_id}'
                ),
                'Quantity': 1,
                'UnitPrice': float(order.price_paid),
            }],
        }
        resp = requests.post(
            f"{self._base_url()}/v2/ExecutePayment",
            json=payload,
            headers={
                'Authorization': f"Bearer {self._token()}",
                'Content-Type': 'application/json',
            },
            timeout=15,
        )
        resp.raise_for_status()
        body = resp.json()
        if not body.get('IsSuccess'):
            raise PaymentNotConfiguredError(body.get('Message') or 'MyFatoorah request failed')
        data = body['Data']
        return PaymentCheckoutResult(
            provider=self.name,
            checkout_url=data['PaymentURL'],
            session_id=str(data['InvoiceId']),
        )

    def handle_webhook(self, request):
        secret = getattr(settings, 'MYFATOORAH_WEBHOOK_SECRET', '')
        if not secret:
            raise PaymentWebhookError('Webhook not configured')
        signature = request.headers.get('Myfatoorah-Signature', '')
        if not signature:
            raise PaymentWebhookError('Missing signature')
        try:
            body = json.loads(request.body or b'{}')
        except (ValueError, TypeError) as exc:
            raise PaymentWebhookError('Invalid payload') from exc

        event = body.get('Event') or {}
        data = body.get('Data') or {}
        invoice = data.get('Invoice') or {}
        transaction = data.get('Transaction') or {}

        signature_string = (
            f"Invoice.Id={invoice.get('Id', '')},"
            f"Invoice.Status={invoice.get('Status', '')},"
            f"Transaction.Status={transaction.get('Status', '')},"
            f"Transaction.PaymentId={transaction.get('PaymentId', '')},"
            f"Invoice.ExternalIdentifier={invoice.get('ExternalIdentifier', '')}"
        )
        expected = base64.b64encode(
            hmac.new(secret.encode('utf-8'), signature_string.encode('utf-8'), hashlib.sha256).digest()
        ).decode('utf-8')
        if not hmac.compare_digest(expected, signature):
            raise PaymentWebhookError('Invalid signature')

        if event.get('Name') != 'PAYMENT_STATUS_CHANGED':
            return False
        if transaction.get('Status') != 'SUCCESS':
            return False

        order_id = invoice.get('UserDefinedField') or invoice.get('ExternalIdentifier')
        if not order_id:
            return False
        return self.mark_order_paid(order_id, transaction.get('PaymentId') or '')

import base64
import hashlib
import hmac
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.marketplace.models import Order, Service
from apps.marketplace.payments import MyFatoorahProvider

User = get_user_model()


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


@pytest.fixture
def provider_user():
    return User.objects.create_user(
        email="provider@example.com",
        password="TestPass@123",
        is_verified=True,
    )


@pytest.fixture
def buyer_user():
    return User.objects.create_user(
        email="buyer@example.com",
        password="TestPass@123",
        is_verified=True,
    )


@pytest.fixture
def published_service(provider_user):
    from apps.users.models import UserRole

    role = UserRole.objects.create(
        user=provider_user,
        role="teacher",
    )
    return Service.objects.create(
        provider_role=role,
        title={"ar": "حصّة رياضيات", "en": "Math Tutoring"},
        description={"ar": "شرح", "en": "Explanation"},
        service_type=Service.ServiceType.TUTORING,
        price="100.00",
        currency="SAR",
        status=Service.Status.PUBLISHED,
    )


@pytest.fixture
def order(buyer_user, published_service):
    return Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="tok", MYFATOORAH_PAYMENT_METHOD_ID="0")
def test_create_checkout_returns_payment_url(order):
    payload = {
        "IsSuccess": True,
        "Message": "",
        "ValidationErrors": None,
        "Data": {
            "InvoiceId": 927972,
            "IsDirectPayment": False,
            "PaymentURL": "https://demo.myfatoorah.com/pay?invoiceKey=abc",
            "CustomerReference": str(order.id),
            "UserDefinedField": None,
            "RecurringId": "",
        },
    }
    with mock.patch(
        "apps.marketplace.payments.myfatoorah_provider.requests.post",
        return_value=FakeResponse(payload),
    ) as mocked:
        result = MyFatoorahProvider().create_checkout(order, locale="ar")

    assert result.provider == "myfatoorah"
    assert result.checkout_url == payload["Data"]["PaymentURL"]
    assert result.session_id == "927972"

    request = mocked.call_args
    assert request.kwargs["json"]["InvoiceValue"] == 100.0
    assert request.kwargs["json"]["PaymentMethodId"] == 0
    assert request.kwargs["json"]["DisplayCurrencyIso"] == "SAR"
    assert request.kwargs["json"]["CustomerReference"] == str(order.id)
    assert request.kwargs["json"]["UserDefinedField"] == str(order.id)
    assert request.kwargs["json"]["Language"] == "AR"
    assert "provider=myfatoorah" in request.kwargs["json"]["CallBackUrl"]
    assert request.kwargs["headers"]["Authorization"] == "Bearer tok"


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="")
def test_create_checkout_unconfigured(order):
    from apps.marketplace.payments import PaymentNotConfiguredError

    with pytest.raises(PaymentNotConfiguredError):
        MyFatoorahProvider().create_checkout(order)


def _signature(secret, data):
    invoice = data["Data"]["Invoice"]
    transaction = data["Data"]["Transaction"]
    raw = (
        f"Invoice.Id={invoice['Id']},"
        f"Invoice.Status={invoice['Status']},"
        f"Transaction.Status={transaction['Status']},"
        f"Transaction.PaymentId={transaction['PaymentId']},"
        f"Invoice.ExternalIdentifier={invoice['ExternalIdentifier']}"
    )
    digest = hmac.new(secret.encode(), raw.encode(), hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


def _payment_event(order, transaction_status="SUCCESS"):
    return {
        "Event": {
            "Code": 1,
            "Name": "PAYMENT_STATUS_CHANGED",
            "CountryIsoCode": "KWT",
            "CreationDate": "2026-08-03T08:15:00.9500000Z",
            "Reference": "WH-626519",
        },
        "Data": {
            "Invoice": {
                "Id": "927972",
                "Status": "PAID",
                "Reference": "2026000073",
                "UserDefinedField": str(order.id),
                "ExternalIdentifier": "",
            },
            "Transaction": {
                "Id": "86781",
                "Status": transaction_status,
                "PaymentMethod": "VISA/MASTER",
                "PaymentId": "07076409988323998875",
                "ReferenceId": "600408086781",
                "TransactionDate": "2026-08-03T08:15:00.8834074Z",
                "Error": {"Code": "", "Message": ""},
            },
        },
    }


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="tok", MYFATOORAH_WEBHOOK_SECRET="whsec_test")
def test_webhook_marks_order_paid(order):
    event = _payment_event(order)
    client = APIClient()
    resp = client.post(
        "/api/v1/marketplace/payments/webhook/myfatoorah/",
        data=event,
        format="json",
        HTTP_MYFATOORAH_SIGNATURE=_signature("whsec_test", event),
    )
    assert resp.status_code == 200
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PAID
    assert order.status == Order.Status.CONFIRMED
    assert order.payment_provider == "myfatoorah"
    assert order.payment_transaction_id == "07076409988323998875"


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="tok", MYFATOORAH_WEBHOOK_SECRET="whsec_test")
def test_webhook_invalid_signature_rejected(order):
    event = _payment_event(order)
    client = APIClient()
    resp = client.post(
        "/api/v1/marketplace/payments/webhook/myfatoorah/",
        data=event,
        format="json",
        HTTP_MYFATOORAH_SIGNATURE="tampered",
    )
    assert resp.status_code == 400
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PENDING


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="tok", MYFATOORAH_WEBHOOK_SECRET="whsec_test")
def test_webhook_failed_transaction_ignored(order):
    event = _payment_event(order, transaction_status="FAILED")
    client = APIClient()
    resp = client.post(
        "/api/v1/marketplace/payments/webhook/myfatoorah/",
        data=event,
        format="json",
        HTTP_MYFATOORAH_SIGNATURE=_signature("whsec_test", event),
    )
    assert resp.status_code == 200
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PENDING

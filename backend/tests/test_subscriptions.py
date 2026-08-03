import base64
import hashlib
import hmac
from decimal import Decimal
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.marketplace.payments import StripeProvider
from apps.subscriptions.models import Plan, Subscription
from apps.subscriptions.services import activate_subscription

User = get_user_model()


@pytest.fixture
def user():
    return User.objects.create_user(
        email="student@example.com",
        password="TestPass@123",
        is_verified=True,
    )


@pytest.fixture
def client(user):
    from apps.users.views import get_tokens_for_user

    client = APIClient()
    tokens = get_tokens_for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


@pytest.fixture
def pro_plan():
    return Plan.objects.update_or_create(
        code="pro",
        defaults={
            "name": {"ar": "احترافي", "en": "Professional"},
            "description": {"ar": "وصف", "en": "Description"},
            "price": "9.99",
            "currency": "SAR",
            "duration_days": 30,
            "level": 2,
            "features": [{"ar": "ميزة", "en": "Feature"}],
            "is_active": True,
            "is_featured": True,
        },
    )[0]


@pytest.fixture
def free_plan():
    return Plan.objects.update_or_create(
        code="free",
        defaults={
            "name": {"ar": "مجاني", "en": "Free"},
            "price": "0.00",
            "currency": "SAR",
            "duration_days": 30,
            "level": 0,
            "is_active": True,
        },
    )[0]


@pytest.mark.django_db
def test_plans_list_public(pro_plan, free_plan):
    resp = APIClient().get("/api/v1/subscriptions/plans/")
    assert resp.status_code == 200
    data = resp.json()
    codes = [p["code"] for p in data]
    assert "pro" in codes and "free" in codes
    pro = next(p for p in data if p["code"] == "pro")
    assert pro["name"] == "Professional"
    assert pro["features"] == ["Feature"]
    assert "description" in pro


@pytest.mark.django_db
def test_plans_list_localized(pro_plan):
    resp = APIClient().get("/api/v1/subscriptions/plans/?locale=ar")
    assert resp.status_code == 200
    pro = next(p for p in resp.json() if p["code"] == "pro")
    assert pro["name"] == "احترافي"
    assert pro["features"] == ["ميزة"]


class FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="myfatoorah", MYFATOORAH_API_TOKEN="tok", MYFATOORAH_PAYMENT_METHOD_ID="0")
def test_purchase_creates_subscription_and_checkout(client, pro_plan):
    payload = {
        "IsSuccess": True,
        "Message": "",
        "ValidationErrors": None,
        "Data": {
            "InvoiceId": 888001,
            "IsDirectPayment": False,
            "PaymentURL": "https://demo.myfatoorah.com/pay?invoiceKey=xyz",
            "CustomerReference": "",
            "UserDefinedField": None,
            "RecurringId": "",
        },
    }
    with mock.patch(
        "apps.marketplace.payments.myfatoorah_provider.requests.post",
        return_value=FakeResponse(payload),
    ) as mocked:
        resp = client.post("/api/v1/subscriptions/purchase/", {
            "plan_id": pro_plan.id,
            "locale": "ar",
        }, format="json")

    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_available"] is True
    assert data["checkout_url"] == payload["Data"]["PaymentURL"]
    assert data["status"] == "pending"
    subscription = Subscription.objects.get(id=data["id"])
    assert subscription.user.email == "student@example.com"
    assert subscription.plan == pro_plan
    assert subscription.price_paid == Decimal("9.99")
    assert subscription.currency == "SAR"
    assert subscription.payment_provider == "myfatoorah"
    assert subscription.payment_session_id == "888001"
    assert mocked.call_args.kwargs["json"]["UserDefinedField"] == f"subscription:{subscription.id}"
    assert "provider=myfatoorah" in mocked.call_args.kwargs["json"]["CallBackUrl"]
    assert "subscriptions" in mocked.call_args.kwargs["json"]["CallBackUrl"]


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_purchase_without_provider_reports_unavailable(client, pro_plan):
    resp = client.post("/api/v1/subscriptions/purchase/", {
        "plan_id": pro_plan.id,
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_available"] is False
    assert data["checkout_url"] is None
    subscription = Subscription.objects.get(id=data["id"])
    assert subscription.status == Subscription.Status.PENDING


@pytest.mark.django_db
def test_purchase_free_plan_rejected(client, free_plan):
    resp = client.post("/api/v1/subscriptions/purchase/", {
        "plan_id": free_plan.id,
    }, format="json")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_activate_subscription_upgrades_user(user, pro_plan):
    subscription = Subscription.objects.create(
        user=user,
        plan=pro_plan,
        price_paid=pro_plan.price,
        currency="SAR",
    )
    assert activate_subscription(subscription.id, "tx_123") is True
    subscription.refresh_from_db()
    user.refresh_from_db()
    assert subscription.status == Subscription.Status.ACTIVE
    assert subscription.paid_at is not None
    assert subscription.start_at is not None
    assert subscription.end_at is not None
    assert user.subscription_plan == "pro"
    first_end = subscription.end_at
    assert activate_subscription(subscription.id, "tx_456") is True
    subscription.refresh_from_db()
    assert subscription.payment_transaction_id == "tx_123"
    assert subscription.end_at == first_end


@pytest.mark.django_db
def test_activate_subscription_unknown_ignored():
    assert activate_subscription(999999, "tx") is False


@pytest.mark.django_db
def test_mark_paid_dispatches_to_subscription(user, pro_plan):
    subscription = Subscription.objects.create(
        user=user,
        plan=pro_plan,
        price_paid=pro_plan.price,
        currency="SAR",
    )
    handled = StripeProvider().mark_paid("subscription", subscription.id, "pi_999")
    assert handled is True
    subscription.refresh_from_db()
    user.refresh_from_db()
    assert subscription.status == Subscription.Status.ACTIVE
    assert subscription.payment_transaction_id == "pi_999"
    assert user.subscription_plan == "pro"


@pytest.mark.django_db
def test_current_subscription_empty(client):
    resp = client.get("/api/v1/subscriptions/current/")
    assert resp.status_code == 200
    assert resp.json() == {}


@pytest.mark.django_db
def test_current_subscription_returns_active(client, user, pro_plan):
    Subscription.objects.create(user=user, plan=pro_plan, price_paid=pro_plan.price, currency="SAR")
    subscription = Subscription.objects.get(user=user)
    activate_subscription(subscription.id)
    resp = client.get("/api/v1/subscriptions/current/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert data["plan_name"] == "Professional"


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


@pytest.mark.django_db
@override_settings(MYFATOORAH_API_TOKEN="tok", MYFATOORAH_WEBHOOK_SECRET="whsec_test")
def test_webhook_activates_subscription(client, user, pro_plan):
    subscription = Subscription.objects.create(
        user=user,
        plan=pro_plan,
        price_paid=pro_plan.price,
        currency="SAR",
    )
    event = {
        "Event": {
            "Code": 1,
            "Name": "PAYMENT_STATUS_CHANGED",
            "CountryIsoCode": "KWT",
            "CreationDate": "2026-08-03T08:15:00.9500000Z",
            "Reference": "WH-626519",
        },
        "Data": {
            "Invoice": {
                "Id": "888001",
                "Status": "PAID",
                "Reference": "2026000073",
                "UserDefinedField": f"subscription:{subscription.id}",
                "ExternalIdentifier": "",
            },
            "Transaction": {
                "Id": "86781",
                "Status": "SUCCESS",
                "PaymentMethod": "VISA/MASTER",
                "PaymentId": "07076409988323998875",
                "ReferenceId": "600408086781",
                "TransactionDate": "2026-08-03T08:15:00.8834074Z",
                "Error": {"Code": "", "Message": ""},
            },
        },
    }
    resp = APIClient().post(
        "/api/v1/marketplace/payments/webhook/myfatoorah/",
        data=event,
        format="json",
        HTTP_MYFATOORAH_SIGNATURE=_signature("whsec_test", event),
    )
    assert resp.status_code == 200
    subscription.refresh_from_db()
    user.refresh_from_db()
    assert subscription.status == Subscription.Status.ACTIVE
    assert subscription.payment_provider == "myfatoorah"
    assert subscription.payment_transaction_id == "07076409988323998875"
    assert user.subscription_plan == "pro"

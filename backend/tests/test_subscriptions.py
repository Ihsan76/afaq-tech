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
from apps.subscriptions.models import Plan, PlanServiceLimit, Subscription
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
            "prices": {"SAR": "9.99", "JOD": "1.90", "USD": "2.66", "AED": "9.77"},
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


@pytest.mark.django_db
def test_plans_price_localized_by_currency(pro_plan):
    resp = APIClient().get("/api/v1/subscriptions/plans/?currency=USD")
    assert resp.status_code == 200
    pro = next(p for p in resp.json() if p["code"] == "pro")
    assert pro["price"] == "2.66"
    assert pro["currency"] == "USD"
    assert pro["prices"] == {"SAR": "9.99", "JOD": "1.90", "USD": "2.66", "AED": "9.77"}

    resp = APIClient().get("/api/v1/subscriptions/plans/?currency=JOD")
    pro = next(p for p in resp.json() if p["code"] == "pro")
    assert pro["price"] == "1.90"
    assert pro["currency"] == "JOD"


@pytest.mark.django_db
def test_plans_price_falls_back_to_base_currency(pro_plan):
    resp = APIClient().get("/api/v1/subscriptions/plans/?currency=XYZ")
    pro = next(p for p in resp.json() if p["code"] == "pro")
    assert pro["price"] == "9.99"
    assert pro["currency"] == "SAR"


@pytest.mark.django_db
def test_plans_price_respects_user_preference(client, user, pro_plan):
    user.preferred_currency = "USD"
    user.save(update_fields=["preferred_currency"])
    resp = client.get("/api/v1/subscriptions/plans/")
    pro = next(p for p in resp.json() if p["code"] == "pro")
    assert pro["price"] == "2.66"
    assert pro["currency"] == "USD"


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
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_purchase_with_currency_stores_display_price(client, pro_plan):
    resp = client.post("/api/v1/subscriptions/purchase/", {
        "plan_id": pro_plan.id,
        "currency": "USD",
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["display_price"] == "2.66"
    assert data["display_currency"] == "USD"
    subscription = Subscription.objects.get(id=data["id"])
    assert subscription.price_paid == Decimal("9.99")
    assert subscription.currency == "SAR"
    assert subscription.display_price == Decimal("2.66")
    assert subscription.display_currency == "USD"


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_purchase_uses_user_preferred_currency(client, user, pro_plan):
    user.preferred_currency = "JOD"
    user.save(update_fields=["preferred_currency"])
    resp = client.post("/api/v1/subscriptions/purchase/", {
        "plan_id": pro_plan.id,
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["display_price"] == "1.90"
    assert data["display_currency"] == "JOD"


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


@pytest.fixture
def admin_client():
    admin_user = User.objects.create_user(
        email="admin@example.com",
        password="TestPass@123",
        is_verified=True,
        is_staff=True,
        role="admin",
    )
    from apps.users.views import get_tokens_for_user

    admin = APIClient()
    tokens = get_tokens_for_user(admin_user)
    admin.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return admin


@pytest.mark.django_db
def test_admin_plan_list_requires_staff(client, pro_plan):
    resp = client.get("/api/v1/subscriptions/admin/plans/")
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_admin_plan_crud(admin_client, pro_plan):
    resp = admin_client.get("/api/v1/subscriptions/admin/plans/")
    assert resp.status_code == 200
    admin_plans = resp.json()
    assert any(p["code"] == "pro" for p in admin_plans)
    pro = next(p for p in admin_plans if p["code"] == "pro")
    assert pro["prices"]["USD"] == "2.66"

    create = admin_client.post("/api/v1/subscriptions/admin/plans/", {
        "code": "vip",
        "name": {"ar": "VIP", "en": "VIP"},
        "description": {"ar": "", "en": ""},
        "price": "14.99",
        "currency": "SAR",
        "prices": {"SAR": "14.99", "USD": "4.00"},
        "billing_period": "monthly",
        "duration_days": 30,
        "level": 2,
        "features": [{"ar": "ميزة VIP", "en": "VIP feature"}],
        "is_active": True,
        "is_featured": True,
        "sort_order": 9,
    }, format="json")
    assert create.status_code == 201
    plan = Plan.objects.get(code="vip")
    assert plan.get_price("USD") == (Decimal("4.00"), "USD")

    update = admin_client.patch(f"/api/v1/subscriptions/admin/plans/{plan.id}/", {
        "prices": {"SAR": "14.99", "USD": "4.50"},
        "is_featured": False,
    }, format="json")
    assert update.status_code == 200
    plan.refresh_from_db()
    assert str(plan.prices["USD"]) == "4.50"
    assert plan.is_featured is False

    delete = admin_client.delete(f"/api/v1/subscriptions/admin/plans/{plan.id}/")
    assert delete.status_code == 204
    assert not Plan.objects.filter(code="vip").exists()


@pytest.mark.django_db
def test_admin_services_crud(admin_client):
    from apps.subscriptions.models import PlanService

    resp = admin_client.get("/api/v1/subscriptions/admin/services/")
    assert resp.status_code == 200
    services = resp.json()
    assert any(s["code"] == "ai_lesson_plans" for s in services)

    create = admin_client.post("/api/v1/subscriptions/admin/services/", {
        "code": "worksheet_generator",
        "name": {"ar": "مولّد أوراق العمل", "en": "Worksheet Generator"},
        "sort_order": 9,
        "is_active": True,
    }, format="json")
    assert create.status_code == 201
    service = PlanService.objects.get(code="worksheet_generator")

    update = admin_client.patch(f"/api/v1/subscriptions/admin/services/{service.id}/", {"is_active": False}, format="json")
    assert update.status_code == 200
    service.refresh_from_db()
    assert service.is_active is False

    delete = admin_client.delete(f"/api/v1/subscriptions/admin/services/{service.id}/")
    assert delete.status_code == 204


@pytest.mark.django_db
def test_admin_plan_services_replace(admin_client, pro_plan):
    from apps.subscriptions.models import PlanService

    ai = PlanService.objects.get(code="ai_lesson_plans")
    PlanServiceLimit.objects.create(plan=pro_plan, service=ai, limit=100, period="monthly")

    resp = admin_client.get(f"/api/v1/subscriptions/admin/plans/{pro_plan.id}/services/")
    assert resp.status_code == 200
    assert resp.json()[0]["service_code"] == "ai_lesson_plans"
    assert resp.json()[0]["limit"] == 100

    put = admin_client.put(f"/api/v1/subscriptions/admin/plans/{pro_plan.id}/services/", [
        {"code": "ai_lesson_plans", "limit": 50, "period": "monthly", "sort_order": 1},
        {"code": "ai_assistant", "limit": "", "period": "daily", "sort_order": 2},
    ], format="json")
    assert put.status_code == 200
    assert pro_plan.service_limits.count() == 2
    pro_limit = pro_plan.service_limits.get(service__code="ai_lesson_plans")
    assert pro_limit.limit == 50
    assistant_limit = pro_plan.service_limits.get(service__code="ai_assistant")
    assert assistant_limit.limit is None
    assert assistant_limit.period == "daily"


@pytest.mark.django_db
def test_usage_summary_and_recording(user, client):
    from apps.subscriptions.services import record_usage, user_usage_summary

    record_usage(user, "ai_lesson_plans")
    record_usage(user, "ai_lesson_plans")

    resp = client.get("/api/v1/subscriptions/usage/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["plan"] == "free"
    row = next(s for s in data["services"] if s["code"] == "ai_lesson_plans")
    assert row["used"] == 2
    assert row["limit"] == 5
    assert row["period"] == "monthly"

    summary = user_usage_summary(user)
    assert any(s["code"] == "ai_assistant" for s in summary)


@pytest.mark.django_db
def test_lesson_plan_generation_blocked_at_limit(user, client):
    from apps.subscriptions.services import record_usage

    for _ in range(5):
        record_usage(user, "ai_lesson_plans")

    resp = client.post("/api/v1/lesson-plans/generate/", {
        "title": "درس تجريبي",
        "prompt": "اشرح درس عن الفضاء",
        "language": "ar",
    }, format="json")
    assert resp.status_code == 402
    assert resp.json()["error"] == "usage_limit_reached"
    assert resp.json()["limit"] == 5


@pytest.mark.django_db
def test_lesson_plan_generation_records_usage(user, client):
    from unittest import mock

    from apps.subscriptions.models import PlanService, ServiceUsage

    plan_data = {"sections": [{"title": "مقدمة", "content": "نص"}]}
    with mock.patch("apps.lessonplans.views.ai_generate", return_value=(plan_data, "test-model", 100, 50)):
        resp = client.post("/api/v1/lesson-plans/generate/", {
            "title": "درس تجريبي",
            "prompt": "اشرح درس عن الفضاء",
            "language": "ar",
        }, format="json")
    assert resp.status_code in (200, 201)
    usage = ServiceUsage.objects.get(user=user, service=PlanService.objects.get(code="ai_lesson_plans"))
    assert usage.used_count == 1

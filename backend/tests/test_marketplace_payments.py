import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.marketplace.models import Order, Service
from apps.marketplace.payments import (
    MyFatoorahProvider,
    PaymentNotConfiguredError,
    StripeProvider,
    get_provider,
)

User = get_user_model()


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
def buyer_client(buyer_user):
    from apps.users.views import get_tokens_for_user

    client = APIClient()
    tokens = get_tokens_for_user(buyer_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


@pytest.fixture
def published_service(provider_user):
    return Service.objects.create(
        provider=provider_user,
        title={"ar": "حصّة رياضيات", "en": "Math Tutoring"},
        description={"ar": "شرح", "en": "Explanation"},
        service_type=Service.ServiceType.TUTORING,
        price="100.00",
        currency="SAR",
        status=Service.Status.PUBLISHED,
    )


@pytest.mark.django_db
def test_order_created_with_pending_payment(buyer_client, published_service):
    resp = buyer_client.post("/api/v1/marketplace/orders/", {
        "service": published_service.id,
        "notes": "شكراً",
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_status"] == "pending"
    assert data["status"] == "pending"
    assert data["price_paid"] == "100.00"
    order = Order.objects.get(id=data["id"])
    assert order.payment_status == Order.PaymentStatus.PENDING


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_order_creation_without_provider_reports_unavailable(buyer_client, published_service):
    resp = buyer_client.post("/api/v1/marketplace/orders/", {
        "service": published_service.id,
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_available"] is False
    assert data["checkout_url"] is None


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_checkout_retry_unconfigured(buyer_user, buyer_client, published_service):
    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    resp = buyer_client.post(f"/api/v1/marketplace/orders/{order.id}/checkout/?locale=ar")
    assert resp.status_code == 400
    assert resp.json()["payment_available"] is False


@pytest.mark.django_db
def test_stripe_checkout_completed_marks_order_paid(buyer_user, published_service):
    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
        payment_session_id="cs_test_123",
    )
    handled = StripeProvider().mark_order_paid(str(order.id), "pi_test_123")
    assert handled is True
    order.refresh_from_db()
    assert order.payment_status == Order.PaymentStatus.PAID
    assert order.status == Order.Status.CONFIRMED
    assert order.paid_at is not None
    assert order.payment_transaction_id == "pi_test_123"
    assert order.payment_provider == "stripe"


@pytest.mark.django_db
def test_mark_order_paid_unknown_order_ignored():
    handled = StripeProvider().mark_order_paid("999999", "pi_test_123")
    assert handled is False


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="sk_test_x", MYFATOORAH_API_TOKEN="")
def test_auto_provider_prefers_stripe():
    assert isinstance(get_provider(), StripeProvider)


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="tok")
def test_auto_provider_falls_back_to_myfatoorah():
    assert isinstance(get_provider(), MyFatoorahProvider)


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_auto_provider_none_configured_raises():
    with pytest.raises(PaymentNotConfiguredError):
        get_provider()


@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="myfatoorah", MYFATOORAH_API_TOKEN="tok")
def test_explicit_provider_resolves():
    assert isinstance(get_provider(), MyFatoorahProvider)

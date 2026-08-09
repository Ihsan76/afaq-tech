import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.marketplace.models import (
    Order,
    PayoutRequest,
    Service,
    Wallet,
    WalletTransaction,
)
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


# --- Wallet & Payouts ---

@pytest.mark.django_db
def test_mark_order_paid_credits_provider_wallet(buyer_user, published_service):
    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    assert StripeProvider().mark_order_paid(str(order.id), "pi_wallet_1") is True

    wallet = Wallet.objects.get(user=published_service.provider)
    assert wallet.balance == 90  # 100 - 10% platform fee
    tx = wallet.transactions.get(transaction_type=WalletTransaction.Type.SALE_EARNING)
    assert tx.amount == 90
    assert tx.reference_id == f"order_{order.id}"


@pytest.mark.django_db
def test_mark_order_paid_is_idempotent_for_wallet(buyer_user, published_service):
    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_2")
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_2")

    wallet = Wallet.objects.get(user=published_service.provider)
    assert wallet.balance == 90
    assert wallet.transactions.count() == 1


@pytest.mark.django_db
def test_wallet_retrieve_and_transactions_endpoints(buyer_client, buyer_user, published_service):
    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_3")

    wallet_resp = buyer_client.get("/api/v1/marketplace/wallet/?locale=ar")
    assert wallet_resp.status_code == 200
    assert wallet_resp.json()["balance"] == "0.00"  # buyer never earned

    tx_resp = buyer_client.get("/api/v1/marketplace/wallet/transactions/?locale=ar")
    assert tx_resp.status_code == 200
    assert tx_resp.json() == []

    provider_resp = buyer_client.get("/api/v1/marketplace/wallet/?locale=ar")
    assert provider_resp.status_code == 200


@pytest.mark.django_db
def test_payout_request_validates_balance(provider_user, buyer_user, published_service):
    from apps.users.views import get_tokens_for_user

    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_4")

    client = APIClient()
    tokens = get_tokens_for_user(provider_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    over = client.post("/api/v1/marketplace/payouts/?locale=ar", {
        "amount": "999.00",
        "bank_details": "SA-IBAN-001",
    }, format="json")
    assert over.status_code == 400
    assert "amount" in over.json()

    ok = client.post("/api/v1/marketplace/payouts/?locale=ar", {
        "amount": "50.00",
        "bank_details": "SA-IBAN-001",
    }, format="json")
    assert ok.status_code == 201
    assert ok.json()["status"] == "pending"
    assert ok.json()["provider"] == provider_user.id


@pytest.mark.django_db
def test_admin_payout_approve_and_mark_paid(provider_user, buyer_user, published_service):
    from apps.users.views import get_tokens_for_user

    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_5")
    wallet = Wallet.objects.get(user=provider_user)
    assert wallet.balance == 90

    payout = PayoutRequest.objects.create(
        provider=provider_user,
        amount="60.00",
        currency="SAR",
        bank_details="SA-IBAN-001",
    )

    admin = User.objects.create_user(
        email="mkt_admin@example.com",
        password="TestPass@123",
        role="admin",
        is_verified=True,
    )
    admin_client = APIClient()
    tokens = get_tokens_for_user(admin)
    admin_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    approve = admin_client.patch(
        f"/api/v1/marketplace/admin/payouts/{payout.id}/process/?locale=ar",
        {"action": "approve"}, format="json",
    )
    assert approve.status_code == 200
    assert approve.json()["status"] == "approved"

    paid = admin_client.patch(
        f"/api/v1/marketplace/admin/payouts/{payout.id}/process/?locale=ar",
        {"action": "mark_paid"}, format="json",
    )
    assert paid.status_code == 200
    assert paid.json()["status"] == "paid"

    wallet.refresh_from_db()
    assert wallet.balance == 30
    tx = wallet.transactions.get(transaction_type=WalletTransaction.Type.PAYOUT)
    assert tx.amount == -60


@pytest.mark.django_db
def test_mark_paid_requires_sufficient_balance(provider_user, buyer_user, published_service):
    from apps.users.views import get_tokens_for_user

    order = Order.objects.create(
        buyer=buyer_user,
        service=published_service,
        price_paid=published_service.price,
        currency="SAR",
    )
    StripeProvider().mark_order_paid(str(order.id), "pi_wallet_6")

    payout = PayoutRequest.objects.create(
        provider=provider_user,
        amount="9999.00",
        currency="SAR",
        bank_details="SA-IBAN-001",
    )

    admin = User.objects.create_user(
        email="mkt_admin2@example.com",
        password="TestPass@123",
        role="admin",
        is_verified=True,
    )
    admin_client = APIClient()
    tokens = get_tokens_for_user(admin)
    admin_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

    resp = admin_client.patch(
        f"/api/v1/marketplace/admin/payouts/{payout.id}/process/?locale=ar",
        {"action": "mark_paid"}, format="json",
    )
    assert resp.status_code == 400
    assert "Insufficient" in resp.json()["error"]

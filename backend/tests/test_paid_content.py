import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.courses.models import Course, CoursePurchase, Enrollment
from apps.courses.services import activate_course_purchase
from apps.ebooks.models import Ebook, EbookPurchase
from apps.ebooks.services import activate_ebook_purchase
from apps.marketplace.models import Wallet

User = get_user_model()


def make_user(email, **kwargs):
    return User.objects.create_user(
        email=email,
        password="TestPass@123",
        is_verified=True,
        **kwargs,
    )


def auth_client(user):
    from apps.users.views import get_tokens_for_user

    client = APIClient()
    tokens = get_tokens_for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


@pytest.fixture
def instructor():
    return make_user("instructor@example.com")


@pytest.fixture
def buyer():
    return make_user("buyer@example.com")


@pytest.fixture
def paid_course(instructor):
    return Course.objects.create(
        slug="react-basics",
        translations={"en": {"title": "React Basics"}, "ar": {"title": "أساسيات رياكت"}},
        instructor=instructor,
        is_free=False,
        price="100.00",
        access_level="pro",
        platform_fee_percent="20",
        is_published=True,
    )


@pytest.fixture
def free_course():
    return Course.objects.create(
        slug="free-course",
        translations={"en": {"title": "Free Course"}, "ar": {"title": "دورة مجانية"}},
        is_free=True,
        is_published=True,
    )


# ── Course purchases ──

@pytest.mark.django_db
@override_settings(PAYMENT_PROVIDER="auto", STRIPE_SECRET_KEY="", MYFATOORAH_API_TOKEN="")
def test_course_purchase_creation_unconfigured(buyer, paid_course):
    client = auth_client(buyer)
    resp = client.post(f"/api/v1/courses/{paid_course.slug}/purchase/?locale=ar")
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_available"] is False
    assert data["checkout_url"] is None
    purchase = CoursePurchase.objects.get(user=buyer, course=paid_course)
    assert purchase.status == CoursePurchase.Status.PENDING
    assert purchase.price_paid == Course.objects.get(pk=paid_course.pk).price


@pytest.mark.django_db
def test_activate_course_purchase_grants_lifetime_and_credits_wallet(buyer, paid_course):
    purchase = CoursePurchase.objects.create(
        user=buyer, course=paid_course, price_paid="100.00", currency="JOD"
    )
    assert activate_course_purchase(str(purchase.id), "tx_course_1", "stripe") is True

    assert Enrollment.objects.filter(user=buyer, course=paid_course).exists()
    wallet = Wallet.objects.get(user=paid_course.instructor)
    assert wallet.balance == 80  # 100 - 20% configurable platform fee
    tx = wallet.transactions.get(transaction_type=wallet.transactions.model.Type.SALE_EARNING)
    assert tx.reference_id == f"course_purchase_{purchase.id}"


@pytest.mark.django_db
def test_activate_course_purchase_is_idempotent(buyer, paid_course):
    purchase = CoursePurchase.objects.create(
        user=buyer, course=paid_course, price_paid="100.00", currency="JOD"
    )
    assert activate_course_purchase(str(purchase.id), "tx_course_2", "stripe") is True
    assert activate_course_purchase(str(purchase.id), "tx_course_2", "stripe") is True

    assert Enrollment.objects.filter(user=buyer, course=paid_course).count() == 1
    assert Wallet.objects.get(user=paid_course.instructor).transactions.count() == 1


@pytest.mark.django_db
def test_enroll_requires_plan_or_purchase(buyer, free_course, paid_course):
    client = auth_client(buyer)

    resp = client.post(f"/api/v1/courses/{paid_course.slug}/enroll/")
    assert resp.status_code == 402
    assert resp.json()["payment_required"] is True

    buyer.subscription_plan = "pro"
    buyer.save(update_fields=["subscription_plan"])
    resp = client.post(f"/api/v1/courses/{paid_course.slug}/enroll/")
    assert resp.status_code in (200, 201)
    assert Enrollment.objects.filter(user=buyer, course=paid_course).exists()

    resp = client.post(f"/api/v1/courses/{free_course.slug}/enroll/")
    assert resp.status_code in (200, 201)


@pytest.mark.django_db
def test_course_detail_exposes_access_fields(buyer, paid_course):
    client = auth_client(buyer)
    data = client.get(f"/api/v1/courses/{paid_course.slug}/").json()
    assert data["is_free"] is False
    assert data["price"] == "100.00"
    assert data["is_purchased"] is False
    assert data["can_access"] is False

    buyer.subscription_plan = "pro"
    buyer.save(update_fields=["subscription_plan"])
    data = client.get(f"/api/v1/courses/{paid_course.slug}/").json()
    assert data["can_access"] is True


# ── Ebook purchases ──

@pytest.fixture
def author():
    return make_user("author@example.com")


@pytest.fixture
def paid_ebook(author):
    return Ebook.objects.create(
        slug="ebook-pro",
        translations={"ar": {"title": "كتاب احترافي"}, "en": {"title": "Pro Ebook"}},
        author=author,
        is_free=False,
        price="50.00",
        access_level="pro",
        platform_fee_percent="10",
        is_published=True,
    )


@pytest.mark.django_db
def test_ebook_download_after_purchase(buyer, paid_ebook):
    client = auth_client(buyer)

    resp = client.post(f"/api/v1/ebooks/{paid_ebook.slug}/download/")
    assert resp.status_code == 403

    EbookPurchase.objects.create(
        user=buyer,
        ebook=paid_ebook,
        price_paid="50.00",
        currency="JOD",
        status=EbookPurchase.Status.PAID,
    )
    resp = client.post(f"/api/v1/ebooks/{paid_ebook.slug}/download/")
    assert resp.status_code == 200
    assert resp.json()["success"] is True


@pytest.mark.django_db
def test_activate_ebook_purchase_credits_author(buyer, paid_ebook):
    purchase = EbookPurchase.objects.create(
        user=buyer, ebook=paid_ebook, price_paid="50.00", currency="JOD"
    )
    assert activate_ebook_purchase(str(purchase.id), "tx_ebook_1", "stripe") is True

    purchase.refresh_from_db()
    assert purchase.status == EbookPurchase.Status.PAID
    assert Wallet.objects.get(user=paid_ebook.author).balance == 45  # 50 - 10%


@pytest.mark.django_db
def test_ebook_detail_exposes_purchase_fields(buyer, paid_ebook):
    client = auth_client(buyer)
    data = client.get(f"/api/v1/ebooks/{paid_ebook.slug}/").json()
    assert data["price"] == "50.00"
    assert data["is_free"] is False
    assert data["is_purchased"] is False
    assert data["can_download"] is False

from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APIClient

from apps.subscriptions.models import (
    Organization,
    OrganizationMembership,
    Plan,
    PlanServiceLimit,
    SeatPurchase,
    ServiceUsage,
    Subscription,
)
from apps.subscriptions.services import (
    activate_subscription,
    confirm_seat_purchase,
    record_usage,
    user_usage_summary,
)

User = get_user_model()


@pytest.fixture
def school_plan():
    return Plan.objects.update_or_create(
        code="school",
        defaults={
            "name": {"ar": "للمدارس", "en": "School"},
            "price": "49.99",
            "currency": "SAR",
            "duration_days": 30,
            "level": 2,
            "seats": 2,
            "extra_seat_price": "5.00",
            "is_active": True,
        },
    )[0]


@pytest.fixture
def owner_user():
    return User.objects.create_user(
        email="principal@school.edu",
        password="TestPass@123",
        is_verified=True,
        subscription_plan="school",
    )


@pytest.fixture
def owner_client(owner_user):
    from apps.users.views import get_tokens_for_user

    client = APIClient()
    tokens = get_tokens_for_user(owner_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


def _create_org(owner_user, school_plan):
    return Organization.objects.create(name="مدرسة النموذجية", owner=owner_user, plan=school_plan)


def _user_client(user):
    from apps.users.views import get_tokens_for_user

    client = APIClient()
    tokens = get_tokens_for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


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
def test_activate_subscription_creates_organization(owner_user, school_plan):
    subscription = Subscription.objects.create(
        user=owner_user,
        plan=school_plan,
        price_paid=school_plan.price,
        currency="SAR",
    )
    assert activate_subscription(subscription.id, "tx_1") is True
    org = Organization.objects.get(owner=owner_user)
    assert org.plan == school_plan
    assert org.subscription == subscription
    assert org.total_seats() == school_plan.seats


@pytest.mark.django_db
def test_manager_org_requires_school_plan(user, school_plan):
    resp = _user_client(user).get("/api/v1/subscriptions/organizations/my/")
    assert resp.status_code == 403
    assert resp.json()["error"] == "organization_not_available"


@pytest.mark.django_db
def test_manager_org_overview(owner_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    resp = owner_client.get("/api/v1/subscriptions/organizations/my/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == org.id
    assert data["plan_code"] == "school"
    assert data["plan_seats"] == 2
    assert data["total_seats"] == 2
    assert data["occupied_seats"] == 0
    assert data["members"] == []

    resp = owner_client.patch("/api/v1/subscriptions/organizations/my/", {"name": "مدرسة جديدة"}, format="json")
    assert resp.status_code == 200
    org.refresh_from_db()
    assert org.name == "مدرسة جديدة"


@pytest.mark.django_db
def test_invite_teacher_creates_pending_and_sends_email(owner_client, owner_user, school_plan, monkeypatch):
    sent = []
    monkeypatch.setattr(
        "apps.core.email.send_email",
        lambda to, subject, html, from_email=None: sent.append((to, subject, html)) or True,
    )
    _create_org(owner_user, school_plan)
    resp = owner_client.post("/api/v1/subscriptions/organizations/my/invites/", {
        "email": "teacher1@school.edu",
        "locale": "ar",
    }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending"
    assert data["invite_token"]
    assert "join-organization" in data["invite_url"]
    assert len(sent) == 1
    assert sent[0][0] == "teacher1@school.edu"
    assert "join-organization" in sent[0][2]

    org = Organization.objects.get(owner=owner_user)
    assert org.occupied_seats() == 1


@pytest.mark.django_db
def test_seats_limit_enforced(owner_client, owner_user, school_plan):
    _create_org(owner_user, school_plan)
    for i in range(2):
        resp = owner_client.post("/api/v1/subscriptions/organizations/my/invites/", {
            "email": f"teacher{i}@school.edu",
        }, format="json")
        assert resp.status_code == 201
    resp = owner_client.post("/api/v1/subscriptions/organizations/my/invites/", {
        "email": "overflow@school.edu",
    }, format="json")
    assert resp.status_code == 400
    assert resp.json()["error"] == "seats_limit_reached"


@pytest.mark.django_db
def test_accept_invite_makes_active_member(owner_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    membership = OrganizationMembership.objects.create(
        organization=org,
        status=OrganizationMembership.Status.PENDING,
        invite_email="teacher1@school.edu",
        invite_token="tok123",
        invited_by=owner_user,
    )
    teacher = User.objects.create_user(
        email="teacher1@school.edu", password="TestPass@123", is_verified=True
    )
    teacher_client = _user_client(teacher)

    info = APIClient().get("/api/v1/subscriptions/organizations/invites/tok123/")
    assert info.status_code == 200
    assert info.json()["org_name"] == org.name

    resp = teacher_client.post("/api/v1/subscriptions/organizations/invites/tok123/accept/")
    assert resp.status_code == 200
    membership.refresh_from_db()
    assert membership.status == OrganizationMembership.Status.ACTIVE
    assert membership.user == teacher
    assert org.occupied_seats() == 1

    # Accepting again is rejected (no longer pending)
    resp = teacher_client.post("/api/v1/subscriptions/organizations/invites/tok123/accept/")
    assert resp.status_code == 400


@pytest.mark.django_db
def test_accept_invite_email_mismatch(owner_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    OrganizationMembership.objects.create(
        organization=org,
        status=OrganizationMembership.Status.PENDING,
        invite_email="teacher1@school.edu",
        invite_token="tok456",
        invited_by=owner_user,
    )
    other = User.objects.create_user(email="someone@else.com", password="TestPass@123", is_verified=True)
    resp = _user_client(other).post("/api/v1/subscriptions/organizations/invites/tok456/accept/")
    assert resp.status_code == 400
    assert resp.json()["error"] == "email_mismatch"


@pytest.mark.django_db
def test_remove_member_and_cancel_invite(owner_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    teacher = User.objects.create_user(
        email="teacher1@school.edu", password="TestPass@123", is_verified=True
    )
    member = OrganizationMembership.objects.create(
        organization=org,
        user=teacher,
        status=OrganizationMembership.Status.ACTIVE,
        invite_email=teacher.email,
    )
    invite = OrganizationMembership.objects.create(
        organization=org,
        status=OrganizationMembership.Status.PENDING,
        invite_email="pending@school.edu",
        invite_token="tok789",
        invited_by=owner_user,
    )
    assert org.occupied_seats() == 2

    resp = owner_client.post(f"/api/v1/subscriptions/organizations/my/members/{member.id}/remove/")
    assert resp.status_code == 204
    member.refresh_from_db()
    assert member.status == OrganizationMembership.Status.REMOVED

    resp = owner_client.delete("/api/v1/subscriptions/organizations/my/invites/tok789/")
    assert resp.status_code == 204
    invite.refresh_from_db()
    assert invite.status == OrganizationMembership.Status.REMOVED
    assert org.occupied_seats() == 0


@pytest.mark.django_db
def test_set_member_role(owner_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    teacher = User.objects.create_user(
        email="teacher1@school.edu", password="TestPass@123", is_verified=True
    )
    member = OrganizationMembership.objects.create(
        organization=org,
        user=teacher,
        status=OrganizationMembership.Status.ACTIVE,
        invite_email=teacher.email,
    )
    resp = owner_client.post(f"/api/v1/subscriptions/organizations/my/members/{member.id}/role/", {
        "role": "manager",
    }, format="json")
    assert resp.status_code == 200
    member.refresh_from_db()
    assert member.role == OrganizationMembership.Role.MANAGER


@pytest.mark.django_db
def test_shared_usage_pool_across_teachers(owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    ai = org.plan.service_limits.first()
    if ai is None:
        from apps.subscriptions.models import PlanService
        ai = PlanService.objects.get(code="ai_lesson_plans")
        PlanServiceLimit.objects.create(plan=school_plan, service=ai, limit=100, period="monthly")
    teacher1 = User.objects.create_user(email="t1@school.edu", password="TestPass@123", is_verified=True)
    teacher2 = User.objects.create_user(email="t2@school.edu", password="TestPass@123", is_verified=True)
    OrganizationMembership.objects.create(
        organization=org, user=teacher1, status=OrganizationMembership.Status.ACTIVE, invite_email=teacher1.email
    )
    OrganizationMembership.objects.create(
        organization=org, user=teacher2, status=OrganizationMembership.Status.ACTIVE, invite_email=teacher2.email
    )

    record_usage(teacher1, "ai_lesson_plans")
    record_usage(teacher1, "ai_lesson_plans")
    record_usage(teacher2, "ai_lesson_plans")

    row = ServiceUsage.objects.get(organization=org, service=ai)
    assert row.used_count == 3
    assert ServiceUsage.objects.filter(user=teacher1).count() == 0

    summary = user_usage_summary(teacher2)
    row2 = next(s for s in summary if s["code"] == "ai_lesson_plans")
    assert row2["used"] == 3
    assert row2["limit"] == 100


@pytest.mark.django_db
def test_usage_allowed_blocks_when_org_pool_exhausted(owner_user, school_plan):
    from apps.subscriptions.services import usage_allowed

    org = _create_org(owner_user, school_plan)
    from apps.subscriptions.models import PlanService
    ai = PlanService.objects.get(code="ai_lesson_plans")
    PlanServiceLimit.objects.create(plan=school_plan, service=ai, limit=2, period="monthly")
    teacher = User.objects.create_user(email="t1@school.edu", password="TestPass@123", is_verified=True)
    OrganizationMembership.objects.create(
        organization=org, user=teacher, status=OrganizationMembership.Status.ACTIVE, invite_email=teacher.email
    )
    record_usage(teacher, "ai_lesson_plans")
    record_usage(teacher, "ai_lesson_plans")
    allowed, used, limit = usage_allowed(teacher, "ai_lesson_plans")
    assert allowed is False
    assert used == 2
    assert limit == 2


@pytest.mark.django_db
@mock.patch("apps.marketplace.payments.myfatoorah_provider.requests.post")
def test_extra_seats_purchase_and_confirm(mock_post, owner_client, owner_user, school_plan):
    _create_org(owner_user, school_plan)
    payload = {
        "IsSuccess": True,
        "Message": "",
        "Data": {
            "InvoiceId": 777001,
            "IsDirectPayment": False,
            "PaymentURL": "https://demo.myfatoorah.com/pay?invoiceKey=seats",
            "CustomerReference": "",
            "UserDefinedField": None,
            "RecurringId": "",
        },
    }
    fake = mock.Mock()
    fake.raise_for_status = mock.Mock(return_value=None)
    fake.json = mock.Mock(return_value=payload)
    mock_post.return_value = fake

    with override_settings(PAYMENT_PROVIDER="myfatoorah", MYFATOORAH_API_TOKEN="tok", MYFATOORAH_PAYMENT_METHOD_ID="0"):
        resp = owner_client.post("/api/v1/subscriptions/organizations/my/extra-seats/", {
            "count": 5,
        }, format="json")
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_available"] is True
    assert data["price_paid"] == "25.00"
    seat = SeatPurchase.objects.get(id=data["id"])
    assert seat.count == 5
    assert seat.status == SeatPurchase.Status.PENDING

    assert confirm_seat_purchase(seat.id, "tx_seats", provider_name="myfatoorah") is True
    seat.refresh_from_db()
    org = Organization.objects.get(owner=owner_user)
    assert seat.status == SeatPurchase.Status.PAID
    assert org.extra_seats == 5
    assert org.total_seats() == school_plan.seats + 5

    assert confirm_seat_purchase(seat.id, "tx_again") is True
    org.refresh_from_db()
    assert org.extra_seats == 5  # idempotent


@pytest.mark.django_db
def test_seat_purchase_dispatch_via_mark_paid(owner_user, school_plan):
    from apps.marketplace.payments import StripeProvider

    org = _create_org(owner_user, school_plan)
    seat = SeatPurchase.objects.create(
        organization=org, user=owner_user, count=3, price_paid="15.00", currency="SAR"
    )
    assert StripeProvider().mark_paid("seat_purchase", seat.id, "pi_seats") is True
    seat.refresh_from_db()
    org.refresh_from_db()
    assert seat.status == SeatPurchase.Status.PAID
    assert org.extra_seats == 3


@pytest.mark.django_db
def test_admin_organization_crud(admin_client, owner_user, school_plan):
    create = admin_client.post("/api/v1/subscriptions/admin/organizations/", {
        "name": "مدرسة الأمل",
        "owner_email": owner_user.email,
        "plan": school_plan.id,
        "extra_seats": 3,
        "status": "active",
    }, format="json")
    assert create.status_code == 201
    org = Organization.objects.get(name="مدرسة الأمل")
    assert org.owner == owner_user
    assert org.extra_seats == 3

    list_resp = admin_client.get("/api/v1/subscriptions/admin/organizations/")
    assert list_resp.status_code == 200
    assert any(o["name"] == "مدرسة الأمل" for o in list_resp.json())
    item = next(o for o in list_resp.json() if o["id"] == org.id)
    assert item["owner_email"] == owner_user.email
    assert item["plan_code"] == "school"

    patch = admin_client.patch(f"/api/v1/subscriptions/admin/organizations/{org.id}/", {
        "extra_seats": 7,
        "status": "suspended",
    }, format="json")
    assert patch.status_code == 200
    org.refresh_from_db()
    assert org.extra_seats == 7
    assert org.status == Organization.Status.SUSPENDED

    delete = admin_client.delete(f"/api/v1/subscriptions/admin/organizations/{org.id}/")
    assert delete.status_code == 204
    assert not Organization.objects.filter(name="مدرسة الأمل").exists()


@pytest.mark.django_db
def test_admin_organization_members(admin_client, owner_user, school_plan):
    org = _create_org(owner_user, school_plan)
    teacher = User.objects.create_user(email="t1@school.edu", password="TestPass@123", is_verified=True)
    OrganizationMembership.objects.create(
        organization=org, user=teacher, status=OrganizationMembership.Status.ACTIVE, invite_email=teacher.email
    )
    resp = admin_client.get(f"/api/v1/subscriptions/admin/organizations/{org.id}/members/")
    assert resp.status_code == 200
    assert resp.json()[0]["email"] == "t1@school.edu"

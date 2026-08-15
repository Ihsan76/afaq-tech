import pytest
from apps.academics.models import Curriculum, Grade, Subject, Unit
from apps.subscriptions.models import Plan, Subscription
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
def test_minhaji_curriculum_resolution_and_subscription(api_client):
    # 1. Setup grade, subject, curriculum, unit
    grade = Grade.objects.create(
        level=2,
        translations={"ar": {"name": "الثاني الأساسي"}, "en": {"name": "Grade 2"}},
    )
    subject = Subject.objects.create(
        icon="🧪",
        translations={"ar": {"name": "العلوم"}, "en": {"name": "Science"}},
    )
    curriculum = Curriculum.objects.create(
        country="الأردن",
        year=2026,
        grade=grade,
        translations={"ar": {"name": "منهج العلوم الأردني"}, "en": {"name": "Jordanian Science"}},
    )
    Unit.objects.create(
        curriculum=curriculum,
        subject=subject,
        order=1,
        translations={"ar": {"name": "حواس الإنسان"}, "en": {"name": "Human Senses"}},
        outcomes=["يتعرف الطالب على الحواس الخمس", "يميز وظائف الحواس"],
    )

    # 2. Test Resolve API
    resp = api_client.get(f"/api/v1/academics/curricula/resolve/?grade={grade.id}&subject={subject.id}&locale=ar")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 1
    assert data["units"][0]["name"] == "حواس الإنسان"
    assert "يتعرف الطالب على الحواس الخمس" in data["units"][0]["outcomes"]

    # 3. Test Subscription level gating
    user = User.objects.create_user(email="teacher@afaq.app", password="password123", role="teacher")
    plan, _ = Plan.objects.get_or_create(
        code="pro",
        defaults={"name": "Pro Plan", "price": "9.99", "duration_days": 30, "level": 2}
    )
    from django.utils import timezone
    Subscription.objects.create(
        user=user,
        plan=plan,
        status="active",
        end_at=timezone.now() + timezone.timedelta(days=30)
    )

    api_client.force_authenticate(user=user)
    assert user.get_subscription_level() == 2

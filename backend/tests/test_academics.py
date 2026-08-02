import pytest

from apps.academics.models import Curriculum, Grade, Subject, Unit


@pytest.fixture
def seeded_curriculum():
    grade = Grade.objects.create(
        level=1,
        translations={"ar": {"name": "الأول الأساسي"}, "en": {"name": "Grade 1"}},
    )
    math = Subject.objects.create(
        icon="🔢",
        translations={"ar": {"name": "الرياضيات"}, "en": {"name": "Mathematics"}},
    )
    curriculum = Curriculum.objects.create(
        country="السعودية",
        year=2025,
        grade=grade,
        translations={"ar": {"name": "منهج الرياضيات"}, "en": {"name": "Math Curriculum"}},
    )
    Unit.objects.create(
        curriculum=curriculum,
        subject=math,
        order=1,
        translations={"ar": {"name": "الأعداد"}, "en": {"name": "Numbers"}},
        outcomes=["يجمع الأعداد حتى 10", "يرتب الأعداد تصاعدياً"],
    )
    return {"grade": grade, "subject": math, "curriculum": curriculum}


@pytest.mark.django_db
def test_grades_localized_ar(api_client, seeded_curriculum):
    resp = api_client.get("/api/v1/academics/grades/?locale=ar")
    assert resp.status_code == 200
    grade = resp.json()["results"][0]
    assert grade["name"] == "الأول الأساسي"


@pytest.mark.django_db
def test_grades_default_english(api_client, seeded_curriculum):
    resp = api_client.get("/api/v1/academics/grades/")
    assert resp.status_code == 200
    grade = resp.json()["results"][0]
    assert grade["name"] == "Grade 1"


@pytest.mark.django_db
def test_subjects_localized(api_client, seeded_curriculum):
    resp = api_client.get("/api/v1/academics/subjects/?locale=ar")
    assert resp.status_code == 200
    subject = resp.json()["results"][0]
    assert subject["name"] == "الرياضيات"


@pytest.mark.django_db
def test_curriculum_resolve_returns_units(api_client, seeded_curriculum):
    grade = seeded_curriculum["grade"]
    subject = seeded_curriculum["subject"]
    resp = api_client.get(
        f"/api/v1/academics/curricula/resolve/?grade={grade.id}&subject={subject.id}&locale=ar"
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 1
    assert data["units"] is not None
    assert data["units"][0]["outcomes"] == ["يجمع الأعداد حتى 10", "يرتب الأعداد تصاعدياً"]


@pytest.mark.django_db
def test_curriculum_resolve_no_match(api_client):
    resp = api_client.get("/api/v1/academics/curricula/resolve/?grade=999&locale=ar")
    assert resp.status_code == 200
    assert resp.json()["results"] == []

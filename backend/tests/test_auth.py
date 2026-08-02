import pytest


@pytest.mark.django_db
def test_register_returns_tokens(api_client):
    resp = api_client.post(
        "/api/v1/auth/register/",
        {"email": "newuser@example.com", "password": "StrongPass@123"},
        format="json",
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["access"]
    assert data["refresh"]
    assert data["verification_sent"] is True


@pytest.mark.django_db
def test_register_rejects_short_password(api_client):
    resp = api_client.post(
        "/api/v1/auth/register/",
        {"email": "weak@example.com", "password": "123"},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_login_success(api_client, user):
    resp = api_client.post(
        "/api/v1/auth/login/",
        {"email": "test@example.com", "password": "TestPass@123"},
        format="json",
    )
    assert resp.status_code == 200
    assert resp.json()["access"]


@pytest.mark.django_db
def test_login_wrong_password(api_client, user):
    resp = api_client.post(
        "/api/v1/auth/login/",
        {"email": "test@example.com", "password": "WrongPass@1"},
        format="json",
    )
    assert resp.status_code == 401


@pytest.mark.django_db
def test_profile_requires_auth(api_client):
    resp = api_client.get("/api/v1/auth/profile/")
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_profile_with_token(auth_client):
    resp = auth_client.get("/api/v1/auth/profile/")
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


@pytest.mark.django_db
def test_admin_stats_requires_staff(api_client):
    resp = api_client.get("/api/v1/core/admin/stats/")
    assert resp.status_code in (401, 403)

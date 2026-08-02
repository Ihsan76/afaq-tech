import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return User.objects.create_user(
        email="test@example.com",
        password="TestPass@123",
        is_verified=True,
    )


@pytest.fixture
def auth_client(user):
    client = APIClient()
    from apps.users.views import get_tokens_for_user

    tokens = get_tokens_for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return client


@pytest.fixture
def admin_user():
    return User.objects.create_user(
        email="admin@example.com",
        password="AdminPass@123",
        is_staff=True,
        is_superuser=True,
        is_verified=True,
    )

import pytest
from django.contrib.auth import get_user_model

from apps.notifications.models import Notification, PushSubscription
from apps.notifications.services import notify

User = get_user_model()


@pytest.mark.django_db
def test_notify_creates_notification(user):
    notif = notify(
        user,
        type='system',
        title={'ar': 'مرحباً', 'en': 'Hello'},
        body={'ar': 'نص', 'en': 'text'},
        link='/dashboard',
    )
    assert Notification.objects.count() == 1
    assert notif.user == user
    assert notif.is_read is False
    assert notif.title['ar'] == 'مرحباً'


@pytest.mark.django_db
def test_notifications_list_auth_required(api_client):
    resp = api_client.get('/api/v1/notifications/')
    assert resp.status_code == 401


@pytest.mark.django_db
def test_notifications_list_and_unread_count(auth_client, user):
    notify(user, type='system', title={'ar': 'واحد', 'en': 'one'}, body={'ar': 'نص', 'en': 'text'})
    notify(user, type='system', title={'ar': 'اثنان', 'en': 'two'}, body={'ar': 'نص', 'en': 'text'})
    n = Notification.objects.filter(user=user).first()
    n.is_read = True
    n.save()

    resp = auth_client.get('/api/v1/notifications/?locale=ar')
    assert resp.status_code == 200
    assert resp.data['count'] == 2
    assert resp.data['results'][0]['title'] == 'اثنان'

    resp = auth_client.get('/api/v1/notifications/?is_read=false')
    assert resp.data['count'] == 1

    resp = auth_client.get('/api/v1/notifications/unread-count/')
    assert resp.json() == {'count': 1}


@pytest.mark.django_db
def test_mark_read_single_and_all(auth_client, user):
    a = notify(user, type='system', title={'ar': 'أ', 'en': 'a'}, body={'ar': 'نص', 'en': 'text'})
    b = notify(user, type='system', title={'ar': 'ب', 'en': 'b'}, body={'ar': 'نص', 'en': 'text'})

    resp = auth_client.post('/api/v1/notifications/mark-read/', {'notification_id': a.id})
    assert resp.status_code == 200
    assert resp.json()['updated'] == 1
    a.refresh_from_db()
    assert a.is_read is True
    assert b.is_read is False

    resp = auth_client.post('/api/v1/notifications/mark-read/', {'all': True})
    assert resp.json()['updated'] == 1
    assert Notification.objects.filter(user=user, is_read=False).count() == 0


@pytest.mark.django_db
def test_mark_read_ignores_other_users_notification(auth_client, user, admin_user):
    other = notify(admin_user, type='system', title={'ar': 'أ', 'en': 'a'}, body={'ar': 'نص', 'en': 'text'})
    resp = auth_client.post('/api/v1/notifications/mark-read/', {'notification_id': other.id})
    assert resp.status_code == 200
    assert resp.json()['updated'] == 0
    other.refresh_from_db()
    assert other.is_read is False


@pytest.mark.django_db
def test_push_subscription_crud(auth_client, user):
    payload = {
        'endpoint': 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
        'p256dh': 'A' * 87,
        'auth': 'B' * 22,
    }
    resp = auth_client.post('/api/v1/notifications/push/subscription/', payload)
    assert resp.status_code == 201
    assert PushSubscription.objects.filter(user=user).count() == 1

    resp = auth_client.get('/api/v1/notifications/push/subscription/')
    assert resp.json()['enabled'] is True

    # Re-posting same endpoint updates rather than duplicates.
    payload['auth'] = 'C' * 22
    resp = auth_client.post('/api/v1/notifications/push/subscription/', payload)
    assert resp.status_code == 201
    assert PushSubscription.objects.filter(user=user).count() == 1

    resp = auth_client.delete('/api/v1/notifications/push/subscription/')
    assert resp.json()['deleted'] == 1
    assert PushSubscription.objects.filter(user=user).count() == 0


@pytest.mark.django_db
def test_push_public_key_404_when_unconfigured(auth_client):
    resp = auth_client.get('/api/v1/notifications/push/public-key/')
    assert resp.status_code == 404

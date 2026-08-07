from django.urls import path

from . import views

urlpatterns = [
    path('', views.MyNotificationsListView.as_view(), name='notification-list'),
    path('unread-count/', views.unread_count, name='notification-unread-count'),
    path('mark-read/', views.mark_read, name='notification-mark-read'),
    path('push/subscription/', views.push_subscription, name='push-subscription'),
    path('push/public-key/', views.push_public_key, name='push-public-key'),
]

from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer, PushSubscriptionSerializer
from .webpush import get_public_key


class MyNotificationsListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user)
        is_read = self.request.query_params.get('is_read')
        if is_read in ('true', '1'):
            qs = qs.filter(is_read=True)
        elif is_read in ('false', '0'):
            qs = qs.filter(is_read=False)
        return qs


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_read(request):
    notification_id = request.data.get('notification_id')
    mark_all = request.data.get('all')
    if mark_all:
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'updated': updated})
    if not notification_id:
        return Response({'error': 'notification_id or all is required'}, status=status.HTTP_400_BAD_REQUEST)
    updated = Notification.objects.filter(
        Q(pk=notification_id) & Q(user=request.user)
    ).update(is_read=True)
    return Response({'updated': updated})


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def push_subscription(request):
    if request.method == 'GET':
        subs = PushSubscription.objects.filter(user=request.user)
        return Response({'subscriptions': subs.count(), 'enabled': subs.exists()})

    if request.method == 'DELETE':
        deleted = PushSubscription.objects.filter(user=request.user).delete()[0]
        return Response({'deleted': deleted})

    serializer = PushSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    sub, created = PushSubscription.objects.update_or_create(
        endpoint=serializer.validated_data['endpoint'],
        defaults={
            'user': request.user,
            'p256dh': serializer.validated_data['p256dh'],
            'auth': serializer.validated_data['auth'],
        },
    )
    return Response({'created': created, 'endpoint': sub.endpoint}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def push_public_key(request):
    key = get_public_key()
    if not key:
        return Response({'error': 'Web push is not configured'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'public_key': key})

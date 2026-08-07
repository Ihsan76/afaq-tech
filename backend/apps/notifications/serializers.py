from rest_framework import serializers

from .models import Notification
from .webpush import localized_text


class NotificationSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'icon', 'title', 'body', 'link', 'is_read', 'created_at']
        read_only_fields = fields

    def _locale(self):
        locale = self.context.get('request').query_params.get('locale', '')
        return locale or getattr(self.context['request'].user, 'ui_language', '') or 'ar'

    def get_title(self, obj):
        return localized_text(obj.title, self._locale(), 'title', '')

    def get_body(self, obj):
        return localized_text(obj.body, self._locale(), 'title', '')


class PushSubscriptionSerializer(serializers.Serializer):
    endpoint = serializers.URLField()
    p256dh = serializers.CharField(max_length=256)
    auth = serializers.CharField(max_length=128)

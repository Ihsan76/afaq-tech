from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.CharField(source='sender.email', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_email', 'content', 'attachment', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read']

    def get_sender_name(self, obj):
        return obj.sender.translations.get('ar', {}).get('name', obj.sender.email) if hasattr(obj.sender, 'translations') else obj.sender.email


class ConversationSerializer(serializers.ModelSerializer):
    participants_detail = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'participants_detail', 'school', 'last_message', 'unread_count', 'created_at', 'updated_at']
        read_only_fields = ['participants']

    def get_participants_detail(self, obj):
        return [
            {
                'id': p.id,
                'email': p.email,
                'name': p.translations.get('ar', {}).get('name', p.email) if hasattr(p, 'translations') else p.email,
                'role': getattr(p, 'role', ''),
            }
            for p in obj.participants.all()
        ]

    def get_last_message(self, obj):
        msg = obj.last_message
        if not msg:
            return None
        return MessageSerializer(msg).data

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

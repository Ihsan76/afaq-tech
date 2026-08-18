import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        self.user = self.scope.get('user', AnonymousUser)

        if self.user.is_anonymous:
            await self.close()
            return

        is_participant = await self.check_participation()
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')

        if message_type == 'message':
            content = data.get('content', '').strip()
            if not content:
                return

            message = await self.save_message(content)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message.id,
                        'sender': self.user.id,
                        'sender_name': self.user.email,
                        'content': content,
                        'created_at': message.created_at.isoformat(),
                    },
                },
            )

        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.user.id,
                    'user_name': self.user.email,
                    'is_typing': data.get('is_typing', False),
                },
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))

    async def typing_indicator(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'is_typing': event['is_typing'],
            }))

    @database_sync_to_async
    def check_participation(self):
        from .models import Conversation
        return Conversation.objects.filter(
            id=self.conversation_id,
            participants=self.user,
        ).exists()

    @database_sync_to_async
    def save_message(self, content):
        from .models import Message
        message = Message.objects.create(
            conversation_id=self.conversation_id,
            sender=self.user,
            content=content,
        )
        from django.utils import timezone
        from .models import Conversation
        Conversation.objects.filter(id=self.conversation_id).update(updated_at=timezone.now())
        return message

import json
import time
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Conversation, Message, AIRun, AIModel
from .serializers import (
    ConversationSerializer,
    ConversationDetailSerializer,
    MessageSerializer,
    ChatInputSerializer,
    AIModelSerializer,
    AIModelPublicSerializer,
)
from .services import chat_stream


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def chat_stream_view(request):
    serializer = ChatInputSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    user = request.user
    message_text = serializer.validated_data['message']
    conversation_id = serializer.validated_data.get('conversation_id')
    requested_model_id = serializer.validated_data.get('model_id', '')

    if conversation_id:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=user)
    else:
        title = message_text[:80]
        if len(title) > 80:
            title += '...'
        conversation = Conversation.objects.create(user=user, title=title)

    user_msg = Message.objects.create(
        conversation=conversation,
        role=Message.Role.USER,
        content=message_text,
    )

    past_messages = Message.objects.filter(conversation=conversation).exclude(id=user_msg.id)

    def event_stream():
        full_text = ""
        total_tokens = 0
        duration_ms = 0
        actual_model = ""

        start_time = time.time()

        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conversation.id})}\n\n"

        for chunk_result in chat_stream(past_messages, message_text, requested_model_id):
            text_chunk = chunk_result[0]
            final_text = chunk_result[1]
            tokens = chunk_result[2]
            elapsed = chunk_result[3]
            actual_model = chunk_result[4]

            if text_chunk is not None:
                full_text += text_chunk
                yield f"data: {json.dumps({'type': 'chunk', 'content': text_chunk})}\n\n"
            else:
                full_text = final_text
                total_tokens = tokens or 0
                duration_ms = elapsed or int((time.time() - start_time) * 1000)

        assistant_msg = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=full_text,
            tokens=total_tokens,
        )

        AIRun.objects.create(
            user=user,
            feature=AIRun.Feature.CHAT,
            prompt=message_text,
            response=full_text,
            model_used=actual_model or "unknown",
            tokens_used=total_tokens,
            duration_ms=duration_ms,
        )

        if not conversation.title or conversation.title == message_text[:80] + ('...' if len(message_text[:80]) == 80 else ''):
            new_title = full_text[:80]
            if len(new_title) > 80:
                new_title += '...'
            conversation.title = new_title
            conversation.save(update_fields=['title'])

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation.id, 'message_id': assistant_msg.id, 'model': actual_model})}\n\n"

    return StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        },
    )


class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


class ConversationCreateView(generics.CreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


class ConversationDeleteView(generics.DestroyAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def conversation_clear_view(request, pk):
    conversation = get_object_or_404(Conversation, id=pk, user=request.user)
    conversation.messages.all().delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# --- AIModel management ---

class AIModelAdminListView(generics.ListCreateAPIView):
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    permission_classes = [permissions.IsAdminUser]


class AIModelAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer
    permission_classes = [permissions.IsAdminUser]


class AIModelPublicListView(generics.ListAPIView):
    queryset = AIModel.objects.filter(is_active=True)
    serializer_class = AIModelPublicSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

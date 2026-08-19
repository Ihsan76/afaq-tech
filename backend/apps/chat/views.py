from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Conversation
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        conversation = serializer.save()
        conversation.participants.add(self.request.user)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.order_by('created_at')
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(sender=request.user, conversation=conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        return Response({'status': 'ok'})

    @action(detail=False, methods=['post'])
    def start_conversation(self, request):
        participant_ids = request.data.get('participant_ids', [])
        school_id = request.data.get('school_id')

        if not participant_ids:
            return Response({'error': 'participant_ids are required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = Conversation.objects.filter(
            participants__in=participant_ids + [request.user.id]
        ).distinct()

        for conv in existing:
            conv_participants = set(conv.participants.values_list('id', flat=True))
            if conv_participants == set(participant_ids + [request.user.id]):
                return Response(ConversationSerializer(conv, context={'request': request}).data)

        conversation = Conversation.objects.create(school_id=school_id)
        conversation.participants.add(request.user, *participant_ids)
        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

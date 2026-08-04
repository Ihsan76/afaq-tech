import json
import time

from django.conf import settings
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from google import genai
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    AIModel,
    AIProvider,
    AIRun,
    Conversation,
    GradePromptProfile,
    Message,
    PromptTemplate,
    ProviderType,
    SubjectPromptProfile,
)
from .serializers import (
    AIModelPublicSerializer,
    AIModelSerializer,
    AIProviderSerializer,
    AIRunAdminSerializer,
    ChatInputSerializer,
    ConversationDetailSerializer,
    ConversationSerializer,
    GradePromptProfileListSerializer,
    GradePromptProfileSerializer,
    PromptTemplateListSerializer,
    PromptTemplateSerializer,
    ProviderTypeSerializer,
    SubjectPromptProfileSerializer,
)
from .services import chat_stream


class AIRunAdminListView(generics.ListAPIView):
    serializer_class = AIRunAdminSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        from django.db.models import Q
        qs = AIRun.objects.select_related('user').all()
        feature = self.request.query_params.get('feature')
        model = self.request.query_params.get('model')
        search = self.request.query_params.get('search')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if feature:
            qs = qs.filter(feature=feature)
        if model:
            qs = qs.filter(model_used__icontains=model)
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(user__name_ar__icontains=search)
                | Q(user__name_en__icontains=search)
                | Q(prompt__icontains=search)
            )
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)
        return qs.order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def air_run_stats(request):
    from django.db.models import Avg, Count, Sum
    qs = AIRun.objects.all()
    feature = request.query_params.get('feature')
    if feature:
        qs = qs.filter(feature=feature)
    total = qs.count()
    stats = qs.aggregate(
        total_tokens=Sum('tokens_used'),
        total_cost=Sum('cost'),
        avg_duration_ms=Avg('duration_ms'),
    )
    by_feature = (AIRun.objects.filter(feature=feature) if feature else AIRun.objects.all()) \
        .values('feature') \
        .annotate(count=Count('id'), tokens=Sum('tokens_used')) \
        .order_by('-count')
    return Response({
        'total_runs': total,
        'total_tokens': stats['total_tokens'] or 0,
        'total_cost': float(stats['total_cost'] or 0),
        'avg_duration_ms': round(stats['avg_duration_ms'] or 0),
        'by_feature': list(by_feature),
    })


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


# --- ProviderType management ---

class ProviderTypeListView(generics.ListAPIView):
    queryset = ProviderType.objects.filter(is_active=True)
    serializer_class = ProviderTypeSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


# --- AIProvider management ---

class AIProviderListCreateView(generics.ListCreateAPIView):
    queryset = AIProvider.objects.select_related('provider_type').all()
    serializer_class = AIProviderSerializer
    permission_classes = [permissions.IsAdminUser]


class AIProviderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AIProvider.objects.select_related('provider_type').all()
    serializer_class = AIProviderSerializer
    permission_classes = [permissions.IsAdminUser]


def _resolve_provider_and_key(request):
    provider_id = request.data.get('provider_id')
    api_key = request.data.get('api_key', '')
    provider_type_code = 'google'
    base_url = ''
    if provider_id:
        provider = get_object_or_404(AIProvider.objects.select_related('provider_type'), id=provider_id)
        api_key = provider.get_api_key()
        provider_type_code = provider.provider_type.code
        base_url = provider.base_url
    else:
        provider_type_code = request.data.get('provider_type', 'google')
        base_url = request.data.get('base_url', '')
    if not api_key and provider_type_code == 'google':
        api_key = settings.GEMINI_API_KEY
    return provider_type_code, api_key, base_url


def _fetch_google_models(api_key):
    client = genai.Client(api_key=api_key)
    models = client.models.list()
    result = []
    for m in models:
        methods = getattr(m, 'supported_generation_methods', None)
        if not methods or 'generateContent' in methods:
            name = m.name.replace('models/', '') if getattr(m, 'name', None) else ''
            if name:
                result.append({
                    'model_id': name,
                    'display_name': getattr(m, 'display_name', name),
                    'description': getattr(m, 'description', ''),
                    'input_token_limit': getattr(m, 'input_token_limit', 0),
                    'output_token_limit': getattr(m, 'output_token_limit', 0),
                })
    return result


def _fetch_openai_models(api_key):
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    models = client.models.list()
    result = []
    for m in models:
        if m.id.startswith('gpt-') or m.id.startswith('o'):
            result.append({
                'model_id': m.id,
                'display_name': m.id,
                'description': '',
                'input_token_limit': 0,
                'output_token_limit': 0,
            })
    return result


def _fetch_ollama_models(base_url, api_key=''):
    import requests
    url = (base_url or 'http://localhost:11434').rstrip('/') + '/api/tags'
    headers = {}
    if api_key:
        headers['Authorization'] = f'Bearer {api_key}'
    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    result = []
    for m in data.get('models', []):
        name = m.get('name', '')
        result.append({
            'model_id': name,
            'display_name': name,
            'description': m.get('details', {}).get('family', ''),
            'input_token_limit': 0,
            'output_token_limit': 0,
        })
    return result


def _fetch_openai_compatible_models(base_url, api_key=''):
    from openai import OpenAI
    b_url = (base_url or '').rstrip('/')
    if b_url and not b_url.endswith('/v1'):
        b_url += '/v1'
    client = OpenAI(api_key=api_key or 'sk-placeholder', base_url=b_url)
    models = client.models.list()
    result = []
    for m in models:
        result.append({
            'model_id': m.id,
            'display_name': m.id,
            'description': '',
            'input_token_limit': 0,
            'output_token_limit': 0,
        })
    return result


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def test_provider_connection(request):
    provider_type, api_key, base_url = _resolve_provider_and_key(request)
    try:
        if provider_type == 'google':
            client = genai.Client(api_key=api_key)
            client.models.list()
        elif provider_type == 'openai':
            from openai import OpenAI
            OpenAI(api_key=api_key).models.list()
        elif provider_type == 'anthropic':
            return Response({'error': 'Anthropic not yet supported'}, status=status.HTTP_400_BAD_REQUEST)
        elif provider_type == 'ollama':
            _fetch_ollama_models(base_url, api_key)
        elif provider_type == 'openai_compatible':
            _fetch_openai_compatible_models(base_url, api_key)
        return Response({'status': 'ok'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def fetch_provider_models(request):
    provider_type, api_key, base_url = _resolve_provider_and_key(request)
    try:
        if provider_type == 'google':
            if not api_key:
                return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)
            result = _fetch_google_models(api_key)
        elif provider_type == 'openai':
            if not api_key:
                return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)
            result = _fetch_openai_models(api_key)
        elif provider_type == 'anthropic':
            return Response({'error': 'Anthropic model listing not yet supported'}, status=status.HTTP_400_BAD_REQUEST)
        elif provider_type == 'ollama':
            result = _fetch_ollama_models(base_url, api_key)
        elif provider_type == 'openai_compatible':
            result = _fetch_openai_compatible_models(base_url, api_key)
        else:
            return Response({'error': f'Unknown provider: {provider_type}'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'models': result})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAdminUser])
def import_provider_models(request):
    items = request.data.get('models', [])
    if not items:
        return Response({'error': 'No models provided'}, status=status.HTTP_400_BAD_REQUEST)
    created = []
    for item in items:
        model_id = item.get('model_id')
        if not model_id:
            continue
        display_name = item.get('display_name', model_id)
        lang = item.get('lang', 'en')
        name = {lang: display_name}
        description = {lang: item.get('description', '')}
        obj, was_created = AIModel.objects.update_or_create(
            model_id=model_id,
            defaults={
                'provider': item.get('provider', 'google'),
                'name_ar': display_name,
                'name_en': display_name,
                'description_ar': item.get('description', ''),
                'description_en': item.get('description', ''),
                'name': name,
                'description': description,
                'max_tokens': item.get('max_tokens', item.get('output_token_limit', 4096)),
                'is_active': True,
                'sort_order': AIModel.objects.count() + 1,
            },
        )
        created.append({'model_id': model_id, 'created': was_created})
    return Response({'imported': created})


# --- Prompt Template CRUD ---

class PromptTemplateListView(generics.ListCreateAPIView):
    queryset = PromptTemplate.objects.all()
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return PromptTemplateListSerializer
        return PromptTemplateSerializer


class PromptTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer
    permission_classes = [permissions.IsAdminUser]


# --- Grade Prompt Profile CRUD ---

class GradePromptProfileListView(generics.ListCreateAPIView):
    queryset = GradePromptProfile.objects.select_related('grade').prefetch_related('subject_profiles__subject').all()
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return GradePromptProfileListSerializer
        return GradePromptProfileSerializer


class GradePromptProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = GradePromptProfile.objects.select_related('grade').prefetch_related('subject_profiles__subject').all()
    serializer_class = GradePromptProfileSerializer
    permission_classes = [permissions.IsAdminUser]


# --- Subject Prompt Profile CRUD ---

class SubjectPromptProfileListView(generics.ListCreateAPIView):
    queryset = SubjectPromptProfile.objects.select_related('grade_profile__grade', 'subject').all()
    serializer_class = SubjectPromptProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class SubjectPromptProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubjectPromptProfile.objects.select_related('grade_profile__grade', 'subject').all()
    serializer_class = SubjectPromptProfileSerializer
    permission_classes = [permissions.IsAdminUser]

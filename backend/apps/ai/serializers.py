from rest_framework import serializers
from .models import Conversation, Message, AIModel, AIProvider, ProviderType, PromptTemplate, GradePromptProfile, SubjectPromptProfile


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'tokens', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'message_count', 'last_message', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {'role': last.role, 'content': last.content[:100]}
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'title', 'messages', 'created_at', 'updated_at']


class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'name_ar', 'name_en', 'description_ar', 'description_en']


class AIModelPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = ['id', 'provider', 'model_id', 'name', 'description', 'name_ar', 'name_en', 'description_ar', 'description_en', 'is_default', 'max_tokens']


class ProviderTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderType
        fields = ['code', 'name_ar', 'name_en', 'needs_base_url', 'default_base_url', 'needs_api_key', 'supports_fetching', 'sort_order', 'is_active']


class AIProviderSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    api_key_configured = serializers.SerializerMethodField()
    api_key_masked = serializers.SerializerMethodField()
    provider_type = serializers.SlugRelatedField(slug_field='code', queryset=ProviderType.objects.all())
    provider_type_display = ProviderTypeSerializer(source='provider_type', read_only=True)

    class Meta:
        model = AIProvider
        fields = ['id', 'name', 'provider_type', 'provider_type_display', 'base_url', 'api_key', 'api_key_configured', 'api_key_masked', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_api_key_configured(self, obj):
        return bool(obj.encrypted_api_key)

    def get_api_key_masked(self, obj):
        raw = obj.get_api_key()
        if not raw:
            return ""
        if len(raw) <= 4:
            return raw
        return raw[:4] + "*" * (len(raw) - 4)

    def create(self, validated_data):
        api_key = validated_data.pop('api_key', '')
        instance = AIProvider(**validated_data)
        if api_key:
            instance.set_api_key(api_key)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        api_key = validated_data.pop('api_key', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if api_key is not None:
            instance.set_api_key(api_key)
        instance.save()
        return instance


class ChatInputSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField(required=True, min_length=1)
    model_id = serializers.CharField(required=False, allow_blank=True, default='')


# --- Prompt Template CRUD ---

class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class PromptTemplateListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = ['id', 'name', 'feature_key', 'language', 'learner_stage', 'subject', 'curriculum', 'priority', 'is_default', 'is_active', 'version', 'template_body', 'user_message_template', 'updated_at']


# --- Grade Prompt Profile CRUD ---

class SubjectPromptProfileSerializer(serializers.ModelSerializer):
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = SubjectPromptProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_subject_name(self, obj):
        t = obj.subject.translations or {}
        if isinstance(t, dict):
            return t.get('ar', {}).get('name', '') or t.get('en', {}).get('name', '') or str(obj.subject)
        return str(obj.subject)


class GradePromptProfileSerializer(serializers.ModelSerializer):
    grade_name = serializers.SerializerMethodField()
    subject_profiles = SubjectPromptProfileSerializer(many=True, read_only=True)

    class Meta:
        model = GradePromptProfile
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_grade_name(self, obj):
        t = obj.grade.translations or {}
        if isinstance(t, dict):
            return t.get('ar', {}).get('name', '') or t.get('en', {}).get('name', '') or str(obj.grade)
        return str(obj.grade)


class GradePromptProfileListSerializer(serializers.ModelSerializer):
    grade_name = serializers.SerializerMethodField()

    class Meta:
        model = GradePromptProfile
        fields = ['id', 'grade', 'grade_name', 'learner_stage', 'is_active', 'updated_at']

    def get_grade_name(self, obj):
        t = obj.grade.translations or {}
        if isinstance(t, dict):
            return t.get('ar', {}).get('name', '') or t.get('en', {}).get('name', '') or str(obj.grade)
        return str(obj.grade)
        return obj.grade.translations.get('ar', str(obj.grade)) if hasattr(obj.grade, 'translations') else str(obj.grade)

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AIRun(models.Model):
    class Feature(models.TextChoices):
        LESSON_PLAN = 'lesson_plan', _('Lesson Plan')
        QUIZ = 'quiz', _('Quiz')
        EXPLANATION = 'exploration', _('Explanation')
        CHAT = 'chat', _('Chat')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_runs')
    feature = models.CharField(_('Feature'), max_length=20, choices=Feature.choices)
    prompt = models.TextField(_('Prompt'))
    response = models.TextField(_('Response'), blank=True)
    model_used = models.CharField(_('Model'), max_length=100)
    tokens_used = models.IntegerField(_('Tokens Used'), default=0)
    cost = models.DecimalField(_('Cost'), max_digits=10, decimal_places=6, default=0)
    duration_ms = models.IntegerField(_('Duration (ms)'), default=0)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)

    class Meta:
        verbose_name = _('AI Run')
        verbose_name_plural = _('AI Runs')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.feature} - {self.model_used}"


class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(_('Title'), max_length=255, blank=True, default='')
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or _('Conversation #%(id)s') % {'id': self.id}


class Message(models.Model):
    class Role(models.TextChoices):
        USER = 'user', _('User')
        ASSISTANT = 'assistant', _('Assistant')
        SYSTEM = 'system', _('System')

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(_('Role'), max_length=20, choices=Role.choices)
    content = models.TextField(_('Content'))
    tokens = models.IntegerField(_('Tokens'), default=0)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)

    class Meta:
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"


class ProviderType(models.Model):
    code = models.CharField(_('Code'), max_length=50, unique=True, help_text='e.g. google, openai, ollama')
    name_ar = models.CharField(_('Name (Arabic)'), max_length=100)
    name_en = models.CharField(_('Name (English)'), max_length=100)
    needs_base_url = models.BooleanField(_('Needs API URL'), default=False)
    default_base_url = models.CharField(_('Default URL'), max_length=500, blank=True, default='')
    needs_api_key = models.BooleanField(_('Needs API Key'), default=True)
    supports_fetching = models.BooleanField(_('Supports Model Fetching'), default=True)
    sort_order = models.IntegerField(_('Sort Order'), default=0)
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)

    class Meta:
        verbose_name = _('Provider Type')
        verbose_name_plural = _('Provider Types')
        ordering = ['sort_order', 'name_ar']

    def __str__(self):
        return self.name_ar


class AIProvider(models.Model):
    name = models.CharField(_('Name'), max_length=100)
    provider_type = models.ForeignKey(ProviderType, on_delete=models.PROTECT, verbose_name=_('Provider Type'), related_name='providers', null=True)
    base_url = models.CharField(_('API URL'), max_length=500, blank=True, default='')
    encrypted_api_key = models.TextField(_('Encrypted API Key'), blank=True, default='')
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('AI Provider')
        verbose_name_plural = _('AI Providers')
        ordering = ['name']

    def __str__(self):
        return self.name

    def set_api_key(self, raw_key: str):
        from .utils import encrypt_api_key
        self.encrypted_api_key = encrypt_api_key(raw_key)

    def get_api_key(self) -> str:
        from .utils import decrypt_api_key
        return decrypt_api_key(self.encrypted_api_key)


class AIModel(models.Model):
    provider = models.CharField(_('Provider'), max_length=50, db_index=True)
    model_id = models.CharField(_('Model ID'), max_length=100, help_text='e.g. gemini-3.6-flash')
    name_ar = models.CharField(_('Name (Arabic)'), max_length=100, blank=True, default='')
    name_en = models.CharField(_('Name (English)'), max_length=100, blank=True, default='')
    description_ar = models.TextField(_('Description (Arabic)'), blank=True, default='')
    description_en = models.TextField(_('Description (English)'), blank=True, default='')
    name = models.JSONField(_('Name (Multilingual)'), default=dict, blank=True)
    description = models.JSONField(_('Description (Multilingual)'), default=dict, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    is_default = models.BooleanField(_('Default'), default=False)
    max_tokens = models.IntegerField(_('Max Tokens'), default=4096)
    sort_order = models.IntegerField(_('Sort Order'), default=0)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('AI Model')
        verbose_name_plural = _('AI Models')
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.name.get('ar', self.name_ar)} ({self.model_id})"

    def save(self, *args, **kwargs):
        if self.is_default:
            AIModel.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class EducationStageChoices(models.TextChoices):
    EARLY_PRIMARY = "early_primary", _("Early Primary")
    PRIMARY = "primary", _("Primary")
    MIDDLE = "middle", _("Middle")
    SECONDARY = "secondary", _("Secondary")
    UNIVERSITY = "university", _("University")
    PROFESSIONAL = "professional", _("Professional")


class PromptTemplate(models.Model):
    name = models.CharField(_('Template Name'), max_length=255)
    feature_key = models.CharField(_('Feature Key'), max_length=50, default='lesson_plan', db_index=True)
    language = models.CharField(_('Language'), max_length=10, default='ar', db_index=True)
    learner_stage = models.CharField(_('Education Stage'), max_length=32, choices=EducationStageChoices.choices, blank=True, default='')
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Subject'))
    curriculum = models.ForeignKey('academics.Curriculum', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Curriculum'))
    template_body = models.TextField(_('Template Body'))
    user_message_template = models.TextField(_('User Message Template'), blank=True, default='',
        help_text=_('Short user message sent alongside the system prompt. Can use Django template variables.'))
    priority = models.IntegerField(_('Priority'), default=0, help_text=_('Higher number = higher priority when specialization matches'))
    is_default = models.BooleanField(_('Default Template'), default=False)
    is_active = models.BooleanField(_('Active'), default=True)
    version = models.IntegerField(_('Version'), default=1)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)

    class Meta:
        verbose_name = _('AI Prompt Template')
        verbose_name_plural = _('AI Prompt Templates')
        ordering = ['-priority', '-updated_at']
        constraints = [
            models.UniqueConstraint(
                fields=['feature_key', 'language', 'version'],
                name='unique_prompt_version',
            ),
            models.UniqueConstraint(
                fields=['feature_key', 'language'],
                condition=models.Q(is_active=True, is_default=True),
                name='unique_active_default_prompt_per_feature_lang',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.feature_key} - {self.language})"

    def save(self, *args, **kwargs):
        if self.is_default:
            PromptTemplate.objects.filter(
                feature_key=self.feature_key,
                language=self.language,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class GradePromptProfile(models.Model):
    grade = models.OneToOneField(
        'academics.Grade', on_delete=models.CASCADE,
        related_name='prompt_profile', verbose_name=_('Grade'),
    )
    learner_stage = models.CharField(
        _('Education Stage'), max_length=32,
        choices=EducationStageChoices.choices, blank=True, default='',
    )
    language_guidance = models.TextField(_('Language Guidance'), blank=True, help_text=_('Guidance on language level suitable for this grade'))
    content_depth_guidance = models.TextField(_('Content Depth Guidance'), blank=True)
    activity_guidance = models.TextField(_('Activity Guidance'), blank=True)
    materials_guidance = models.TextField(_('Materials Guidance'), blank=True)
    assessment_guidance = models.TextField(_('Assessment Guidance'), blank=True)
    forbidden_terms = models.JSONField(_('Forbidden Terms'), default=list, blank=True)
    discouraged_patterns = models.JSONField(_('Discouraged Patterns'), default=list, blank=True)
    extra_instructions = models.JSONField(_('Extra Instructions'), default=list, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Grade Prompt Profile')
        verbose_name_plural = _('Grade Prompt Profiles')

    def __str__(self):
        return str(self.grade)


class SubjectPromptProfile(models.Model):
    grade_profile = models.ForeignKey(
        GradePromptProfile, on_delete=models.CASCADE,
        related_name='subject_profiles', verbose_name=_('Grade Profile'),
    )
    subject = models.ForeignKey(
        'academics.Subject', on_delete=models.CASCADE,
        related_name='prompt_profiles', verbose_name=_('Subject'),
    )
    language_guidance = models.TextField(_('Language Guidance'), blank=True)
    content_depth_guidance = models.TextField(_('Content Depth Guidance'), blank=True)
    activity_guidance = models.TextField(_('Activity Guidance'), blank=True)
    materials_guidance = models.TextField(_('Materials Guidance'), blank=True)
    assessment_guidance = models.TextField(_('Assessment Guidance'), blank=True)
    forbidden_terms = models.JSONField(_('Forbidden Terms'), default=list, blank=True)
    discouraged_patterns = models.JSONField(_('Discouraged Patterns'), default=list, blank=True)
    extra_instructions = models.JSONField(_('Extra Instructions'), default=list, blank=True)
    topic_rules = models.TextField(_('Topic Rules'), blank=True, help_text=_('Subject-specific topic constraints'))

    override_language_guidance = models.BooleanField(_('Override Language Guidance'), default=False)
    override_content_depth_guidance = models.BooleanField(_('Override Content Depth'), default=False)
    override_activity_guidance = models.BooleanField(_('Override Activity Guidance'), default=False)
    override_materials_guidance = models.BooleanField(_('Override Materials Guidance'), default=False)
    override_assessment_guidance = models.BooleanField(_('Override Assessment Guidance'), default=False)

    merge_forbidden_terms = models.BooleanField(_('Merge Forbidden Terms'), default=True)
    merge_discouraged_patterns = models.BooleanField(_('Merge Discouraged Patterns'), default=True)
    merge_extra_instructions = models.BooleanField(_('Merge Extra Instructions'), default=True)

    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Subject Prompt Profile')
        verbose_name_plural = _('Subject Prompt Profiles')
        unique_together = ['grade_profile', 'subject']

    def __str__(self):
        return f"{self.grade_profile} - {self.subject}"

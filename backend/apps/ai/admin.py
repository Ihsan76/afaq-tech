from django.contrib import admin

from .models import (
    AIModel,
    AIRun,
    Conversation,
    GradePromptProfile,
    Message,
    PromptTemplate,
    SubjectPromptProfile,
)


@admin.register(AIRun)
class AIRunAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'model_used', 'tokens_used', 'cost', 'duration_ms', 'created_at']
    list_filter = ['feature', 'model_used']
    search_fields = ['prompt', 'response']
    readonly_fields = ['created_at']


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ['role', 'content', 'tokens', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'message_count', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['title', 'user__email']
    inlines = [MessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'content_preview', 'tokens', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content']

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'Content Preview'


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'provider', 'model_id', 'is_active', 'is_default', 'sort_order']
    list_filter = ['provider', 'is_active', 'is_default']
    search_fields = ['name_ar', 'name_en', 'model_id']
    list_editable = ['is_active', 'is_default', 'sort_order']


class SubjectPromptProfileInline(admin.StackedInline):
    model = SubjectPromptProfile
    extra = 0
    fieldsets = [
        ('Basic', {'fields': ['subject', 'topic_rules', 'is_active']}),
        ('Guidance Overrides', {'fields': [
            ('language_guidance', 'override_language_guidance'),
            ('content_depth_guidance', 'override_content_depth_guidance'),
            ('activity_guidance', 'override_activity_guidance'),
            ('materials_guidance', 'override_materials_guidance'),
            ('assessment_guidance', 'override_assessment_guidance'),
        ]}),
        ('List Merge Settings', {'fields': [
            ('forbidden_terms', 'merge_forbidden_terms'),
            ('discouraged_patterns', 'merge_discouraged_patterns'),
            ('extra_instructions', 'merge_extra_instructions'),
        ]}),
    ]


@admin.register(GradePromptProfile)
class GradePromptProfileAdmin(admin.ModelAdmin):
    list_display = ['grade', 'learner_stage', 'is_active']
    list_filter = ['learner_stage', 'is_active']
    search_fields = ['grade__translations']
    inlines = [SubjectPromptProfileInline]
    fieldsets = [
        ('Basic', {'fields': ['grade', 'learner_stage', 'is_active']}),
        ('Guidance', {'fields': [
            'language_guidance', 'content_depth_guidance', 'activity_guidance',
            'materials_guidance', 'assessment_guidance',
        ]}),
        ('Rules', {'fields': ['forbidden_terms', 'discouraged_patterns', 'extra_instructions']}),
    ]


@admin.register(SubjectPromptProfile)
class SubjectPromptProfileAdmin(admin.ModelAdmin):
    list_display = ['grade_profile', 'subject', 'is_active']
    list_filter = ['is_active', 'grade_profile__learner_stage']
    search_fields = ['subject__translations']
    fieldsets = [
        ('Basic', {'fields': ['grade_profile', 'subject', 'topic_rules', 'is_active']}),
        ('Guidance Overrides', {'fields': [
            ('language_guidance', 'override_language_guidance'),
            ('content_depth_guidance', 'override_content_depth_guidance'),
            ('activity_guidance', 'override_activity_guidance'),
            ('materials_guidance', 'override_materials_guidance'),
            ('assessment_guidance', 'override_assessment_guidance'),
        ]}),
        ('List Merge Settings', {'fields': [
            'forbidden_terms', 'merge_forbidden_terms',
            'discouraged_patterns', 'merge_discouraged_patterns',
            'extra_instructions', 'merge_extra_instructions',
        ]}),
    ]


@admin.register(PromptTemplate)
class PromptTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'feature_key', 'language', 'learner_stage', 'subject', 'curriculum', 'priority', 'is_default', 'is_active', 'version']
    list_filter = ['feature_key', 'language', 'is_default', 'is_active']
    search_fields = ['name', 'template_body']
    list_editable = ['priority', 'is_default', 'is_active']
    autocomplete_fields = ['subject', 'curriculum']
    fieldsets = [
        ('Basic', {'fields': ['name', 'feature_key', 'language', 'version']}),
        ('Scope', {'fields': ['learner_stage', 'subject', 'curriculum']}),
        ('System Prompt', {'fields': ['template_body']}),
        ('User Message', {'fields': ['user_message_template']}),
        ('Settings', {'fields': ['priority', 'is_default', 'is_active']}),
    ]

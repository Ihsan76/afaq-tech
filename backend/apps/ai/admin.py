from django.contrib import admin
from .models import AIRun, Conversation, Message, AIModel


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
    message_count.short_description = 'عدد الرسائل'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'content_preview', 'tokens', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content']

    def content_preview(self, obj):
        return obj.content[:80]
    content_preview.short_description = 'المحتوى'


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name_en', 'provider', 'model_id', 'is_active', 'is_default', 'sort_order']
    list_filter = ['provider', 'is_active', 'is_default']
    search_fields = ['name_ar', 'name_en', 'model_id']
    list_editable = ['is_active', 'is_default', 'sort_order']

from django.contrib import admin
from .models import FeatureFlag, Language, TranslationKey

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('key', 'name', 'description')

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'native_name', 'flag', 'is_rtl', 'is_active', 'is_default', 'order')
    list_filter = ('is_active', 'is_default', 'is_rtl')
    search_fields = ('code', 'name', 'native_name')
    list_editable = ('is_active', 'is_default', 'order', 'is_rtl')

@admin.register(TranslationKey)
class TranslationKeyAdmin(admin.ModelAdmin):
    list_display = ('key', 'namespace', 'is_active', 'order', 'updated_at')
    list_filter = ('namespace', 'is_active')
    search_fields = ('key',)
    list_editable = ('is_active', 'order')

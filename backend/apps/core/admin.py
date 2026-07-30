from django.contrib import admin
from .models import FeatureFlag

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    search_fields = ('key', 'name', 'description')

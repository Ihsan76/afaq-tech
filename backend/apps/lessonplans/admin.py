from django.contrib import admin
from .models import LessonPlan


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'grade', 'subject', 'generated_by', 'status', 'created_at']
    list_filter = ['status', 'generated_by', 'grade', 'subject']
    search_fields = ['title']
    readonly_fields = ['created_at', 'updated_at']

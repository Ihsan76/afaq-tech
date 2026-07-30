from django.contrib import admin
from .models import Grade, Subject, Curriculum, Unit, CurriculumDocument


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['level']
    ordering = ['level']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['icon']
    search_fields = ['translations']


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['country', 'year', 'grade']
    list_filter = ['country', 'year', 'grade']
    search_fields = ['translations', 'country']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['curriculum', 'order']
    list_filter = ['curriculum']
    ordering = ['order']


@admin.register(CurriculumDocument)
class CurriculumDocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'curriculum', 'subject', 'created_at']
    list_filter = ['curriculum', 'subject', 'created_at']
    search_fields = ['title', 'extracted_text']


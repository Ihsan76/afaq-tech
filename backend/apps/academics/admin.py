from django.contrib import admin
from .models import Grade, Subject, Curriculum, Unit


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['level']
    ordering = ['level']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['icon']


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['country', 'year', 'grade']
    list_filter = ['country', 'year', 'grade']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['curriculum', 'order']
    list_filter = ['curriculum']
    ordering = ['order']

from django.contrib import admin

from .models import Chapter, Course, CourseCategory, Enrollment, Lesson


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 1


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 1


@admin.register(CourseCategory)
class CourseCategoryAdmin(admin.ModelAdmin):
    list_display = ['slug', 'icon', 'order', 'is_active']
    prepopulated_fields = {'slug': ('slug',)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'category', 'level', 'language', 'is_free', 'is_published', 'is_featured']
    list_filter = ['category', 'level', 'language', 'is_free', 'is_published']
    inlines = [ChapterInline]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'course', 'order']
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'chapter', 'order', 'duration_minutes', 'is_free_preview']
    list_filter = ['is_free_preview']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['user', 'course', 'progress', 'enrolled_at']
    list_filter = ['course']

from django.contrib import admin

from .models import Chapter, Course, CourseCategory, CoursePurchase, Enrollment, Lesson


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
    list_display = ['__str__', 'instructor', 'category', 'level', 'access_level', 'price', 'platform_fee_percent', 'is_published', 'is_featured']
    list_filter = ['category', 'level', 'language', 'access_level', 'is_free', 'is_published']
    list_editable = ['is_published', 'is_featured']
    autocomplete_fields = ['instructor']
    search_fields = ['slug', 'instructor__email']
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


@admin.register(CoursePurchase)
class CoursePurchaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'course', 'status', 'price_paid', 'payment_provider', 'purchased_at', 'created_at']
    list_filter = ['status', 'payment_provider', 'created_at']
    search_fields = ['user__email', 'course__slug']
    readonly_fields = ['created_at', 'updated_at']

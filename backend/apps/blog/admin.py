from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import BlogCategory, BlogPost


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ['slug', 'order', 'is_active']
    prepopulated_fields = {}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['slug', 'category', 'is_published', 'is_featured', 'views', 'published_at']
    list_filter = ['is_published', 'is_featured', 'category']
    search_fields = ['slug']
    prepopulated_fields = {}

    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}
        if object_id:
            extra_context['back_url'] = reverse('admin:blog_blogpost_changelist')
        else:
            extra_context['back_url'] = reverse('admin:blog_blogpost_changelist')
        return super().changeform_view(request, object_id, form_url, extra_context=extra_context)

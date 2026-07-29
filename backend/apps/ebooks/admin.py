from django.contrib import admin
from .models import EbookCategory, Ebook


@admin.register(EbookCategory)
class EbookCategoryAdmin(admin.ModelAdmin):
    list_display = ['slug', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['slug']


@admin.register(Ebook)
class EbookAdmin(admin.ModelAdmin):
    list_display = ['slug', 'category', 'is_published', 'is_featured', 'download_count', 'created_at']
    list_filter = ['is_published', 'is_featured', 'category']
    search_fields = ['slug']

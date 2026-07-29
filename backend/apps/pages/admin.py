from django.contrib import admin
from .models import Page, PageBlock, MenuItem, PageTemplate, SiteSettings


class PageBlockInline(admin.TabularInline):
    model = PageBlock
    extra = 0
    ordering = ['order']
    fields = ['block_type', 'is_active', 'order']


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['slug', 'template', 'is_published', 'is_homepage', 'show_in_nav', 'nav_order']
    list_filter = ['is_published', 'is_homepage', 'show_in_nav', 'template']
    search_fields = ['slug']
    prepopulated_fields = {}
    inlines = [PageBlockInline]
    list_editable = ['is_published', 'show_in_nav', 'nav_order']


@admin.register(PageBlock)
class PageBlockAdmin(admin.ModelAdmin):
    list_display = ['page', 'block_type', 'is_active', 'order']
    list_filter = ['block_type', 'is_active', 'page']
    list_editable = ['is_active', 'order']
    search_fields = []


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['menu', 'url', 'page', 'order', 'is_active']
    list_filter = ['menu', 'is_active']
    list_editable = ['order', 'is_active']
    search_fields = []


@admin.register(PageTemplate)
class PageTemplateAdmin(admin.ModelAdmin):
    list_display = ['slug', 'category', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['slug']


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['email']

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

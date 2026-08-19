from django.contrib import admin

from .models import Ebook, EbookCategory, EbookPurchase


@admin.register(EbookCategory)
class EbookCategoryAdmin(admin.ModelAdmin):
    list_display = ['slug', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['slug']


@admin.register(Ebook)
class EbookAdmin(admin.ModelAdmin):
    list_display = ['slug', 'author_role', 'category', 'access_level', 'price', 'platform_fee_percent', 'is_published', 'is_featured', 'download_count']
    list_filter = ['is_published', 'is_featured', 'category', 'access_level']
    list_editable = ['is_published', 'is_featured']
    autocomplete_fields = ['author_role']
    search_fields = ['slug', 'author_role__user__email']


@admin.register(EbookPurchase)
class EbookPurchaseAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'ebook', 'status', 'price_paid', 'payment_provider', 'purchased_at', 'created_at']
    list_filter = ['status', 'payment_provider', 'created_at']
    search_fields = ['user__email', 'ebook__slug']
    readonly_fields = ['created_at', 'updated_at']

from django.contrib import admin

from .models import (
    Order,
    PayoutRequest,
    Review,
    Service,
    ServiceAvailability,
    ServiceCategory,
    Wallet,
    WalletTransaction,
)


class ServiceAvailabilityInline(admin.TabularInline):
    model = ServiceAvailability
    extra = 1


class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    fields = ['reviewer', 'rating', 'comment', 'is_approved']


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'sort_order', 'is_active']
    list_editable = ['sort_order', 'is_active']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['title', 'provider', 'service_type', 'price', 'status', 'sales_count', 'rating_avg', 'is_featured']
    list_filter = ['service_type', 'status', 'is_online', 'is_featured']
    search_fields = ['title']
    inlines = [ServiceAvailabilityInline, ReviewInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'service', 'status', 'price_paid', 'scheduled_at', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['buyer__email', 'service__title']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'service', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved', 'created_at']
    list_editable = ['is_approved']


class WalletTransactionInline(admin.TabularInline):
    model = WalletTransaction
    extra = 0
    readonly_fields = ['amount', 'transaction_type', 'reference_id', 'description', 'created_at']
    can_delete = False


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'currency', 'updated_at']
    search_fields = ['user__email', 'user__name_ar', 'user__name_en']
    inlines = [WalletTransactionInline]


@admin.register(PayoutRequest)
class PayoutRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'provider', 'amount', 'currency', 'status', 'created_at', 'processed_at']
    list_filter = ['status', 'created_at']
    search_fields = ['provider__email', 'provider__name_ar', 'provider__name_en']

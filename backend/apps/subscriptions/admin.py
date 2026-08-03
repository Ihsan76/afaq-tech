from django.contrib import admin

from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'price', 'currency', 'level', 'duration_days', 'is_active', 'is_featured', 'sort_order']
    list_editable = ['is_active', 'is_featured', 'sort_order']
    list_filter = ['is_active', 'billing_period']
    search_fields = ['code', 'name']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'price_paid', 'currency', 'display_price', 'display_currency', 'start_at', 'end_at', 'created_at']
    list_filter = ['status', 'plan', 'payment_provider']
    search_fields = ['user__email', 'user__translations']
    readonly_fields = ['user', 'plan', 'status', 'price_paid', 'currency', 'display_price', 'display_currency', 'start_at', 'end_at', 'paid_at', 'created_at', 'updated_at']

from django.contrib import admin

from .models import (
    Organization,
    OrganizationMembership,
    Plan,
    PlanService,
    PlanServiceLimit,
    SeatPurchase,
    ServiceUsage,
    Subscription,
)


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'price', 'currency', 'level', 'seats', 'extra_seat_price', 'duration_days', 'is_active', 'is_featured', 'sort_order']
    list_editable = ['is_active', 'is_featured', 'sort_order']
    list_filter = ['is_active', 'billing_period']
    search_fields = ['code', 'name']


@admin.register(PlanService)
class PlanServiceAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'sort_order', 'is_active']
    list_editable = ['sort_order', 'is_active']
    search_fields = ['code', 'name']


@admin.register(PlanServiceLimit)
class PlanServiceLimitAdmin(admin.ModelAdmin):
    list_display = ['plan', 'service', 'limit', 'period', 'sort_order']
    list_filter = ['plan', 'period']


@admin.register(ServiceUsage)
class ServiceUsageAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'service', 'period_key', 'used_count']
    list_filter = ['service', 'organization']
    search_fields = ['user__email', 'organization__name', 'service__code']
    readonly_fields = ['user', 'organization', 'service', 'period_key', 'used_count']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'price_paid', 'currency', 'display_price', 'display_currency', 'start_at', 'end_at', 'created_at']
    list_filter = ['status', 'plan', 'payment_provider']
    search_fields = ['user__email', 'user__translations']
    readonly_fields = ['user', 'plan', 'status', 'price_paid', 'currency', 'display_price', 'display_currency', 'start_at', 'end_at', 'paid_at', 'created_at', 'updated_at']


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'plan', 'status', 'extra_seats', 'created_at']
    list_editable = ['extra_seats', 'status']
    list_filter = ['status', 'plan']
    search_fields = ['name', 'owner__email']


@admin.register(OrganizationMembership)
class OrganizationMembershipAdmin(admin.ModelAdmin):
    list_display = ['organization', 'member_email', 'role', 'status', 'invited_at', 'joined_at']
    list_filter = ['status', 'role', 'organization']
    search_fields = ['organization__name', 'invite_email', 'user__email']


@admin.register(SeatPurchase)
class SeatPurchaseAdmin(admin.ModelAdmin):
    list_display = ['organization', 'count', 'price_paid', 'currency', 'status', 'paid_at', 'created_at']
    list_filter = ['status', 'organization']
    search_fields = ['organization__name', 'payment_transaction_id']

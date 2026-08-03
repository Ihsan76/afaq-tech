from rest_framework import serializers

from .currencies import resolve_currency
from .models import (
    Organization,
    OrganizationMembership,
    Plan,
    PlanService,
    PlanServiceLimit,
    Subscription,
)


def _locale(request):
    if request is None:
        return 'en'
    return request.query_params.get('locale', '') or getattr(request, 'LANGUAGE_CODE', 'en') or 'en'


def _localized(value, locale):
    if isinstance(value, dict):
        for key in (locale, 'en', 'ar'):
            if value.get(key):
                return value[key]
        return ''
    return value or ''


class PlanSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = [
            'id', 'code', 'name', 'description', 'price', 'currency', 'prices',
            'billing_period', 'duration_days', 'level', 'features', 'is_featured',
        ]

    def get_name(self, obj):
        return _localized(obj.name, _locale(self.context.get('request')))

    def get_description(self, obj):
        return _localized(obj.description, _locale(self.context.get('request')))

    def get_features(self, obj):
        locale = _locale(self.context.get('request'))
        features = []
        for feature in (obj.features or []):
            if isinstance(feature, dict):
                features.append(_localized(feature, locale))
            else:
                features.append(feature)
        return features

    def get_currency(self, obj):
        currency = resolve_currency(self.context.get('request'))
        _, used_currency = obj.get_price(currency)
        return used_currency

    def get_price(self, obj):
        currency = resolve_currency(self.context.get('request'))
        price, _ = obj.get_price(currency)
        return str(price)


class AdminPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class PlanServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanService
        fields = '__all__'


class PlanServiceLimitSerializer(serializers.ModelSerializer):
    service_code = serializers.CharField(source='service.code', read_only=True)
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = PlanServiceLimit
        fields = ['id', 'service', 'service_code', 'service_name', 'limit', 'period', 'sort_order']
        read_only_fields = ['service']

    def get_service_name(self, obj):
        return _localized(obj.service.name, _locale(self.context.get('request')))


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_name', 'status', 'payment_provider', 'price_paid',
            'currency', 'display_price', 'display_currency',
            'start_at', 'end_at', 'paid_at', 'created_at',
        ]
        read_only_fields = fields

    def get_plan_name(self, obj):
        return _localized(obj.plan.name, _locale(self.context.get('request')))


class PurchaseSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    locale = serializers.CharField(required=False, default='en')
    currency = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
        except Plan.DoesNotExist:
            raise serializers.ValidationError('Plan not found') from None
        if plan.price <= 0:
            raise serializers.ValidationError('This plan is free')
        return plan


class OrganizationMemberSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationMembership
        fields = ['id', 'email', 'name', 'role', 'status', 'invite_token',
                  'invited_at', 'joined_at', 'is_owner']
        read_only_fields = fields

    def get_email(self, obj):
        return obj.member_email()

    def get_name(self, obj):
        return obj.member_name()

    def get_is_owner(self, obj):
        org = getattr(obj, 'organization', None)
        return bool(org and obj.user_id and org.owner_id == obj.user_id)


class OrganizationSerializer(serializers.ModelSerializer):
    plan_code = serializers.CharField(source='plan.code', read_only=True)
    plan_name = serializers.SerializerMethodField()
    plan_seats = serializers.SerializerMethodField()
    total_seats = serializers.SerializerMethodField()
    occupied_seats = serializers.SerializerMethodField()
    subscription = SubscriptionSerializer(read_only=True)

    class Meta:
        model = Organization
        fields = ['id', 'name', 'plan_code', 'plan_name', 'plan_seats', 'extra_seats',
                  'total_seats', 'occupied_seats', 'status', 'subscription', 'created_at']
        read_only_fields = fields

    def get_plan_name(self, obj):
        return _localized(obj.plan.name, _locale(self.context.get('request')))

    def get_plan_seats(self, obj):
        return obj.plan_seats()

    def get_total_seats(self, obj):
        return obj.total_seats()

    def get_occupied_seats(self, obj):
        return obj.occupied_seats()


class AdminOrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.SerializerMethodField()
    plan_code = serializers.CharField(source='plan.code', read_only=True)
    plan_name = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'owner', 'owner_email', 'owner_name', 'plan', 'plan_code',
                  'plan_name', 'extra_seats', 'status', 'member_count', 'created_at', 'updated_at']
        read_only_fields = ['owner', 'owner_email', 'owner_name', 'plan_code', 'plan_name', 'member_count']

    def get_owner_name(self, obj):
        return obj.owner.translations.get('ar', {}).get('name') or obj.owner.email

    def get_plan_name(self, obj):
        return _localized(obj.plan.name, _locale(self.context.get('request')))

    def get_member_count(self, obj):
        return obj.memberships.filter(
            status=OrganizationMembership.Status.ACTIVE
        ).count()


class SeatPurchaseSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=50)
    locale = serializers.CharField(required=False, default='en')

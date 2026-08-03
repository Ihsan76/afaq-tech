from rest_framework import serializers

from .models import Plan, Subscription


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

    class Meta:
        model = Plan
        fields = [
            'id', 'code', 'name', 'description', 'price', 'currency',
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


class AdminPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_name', 'status', 'payment_provider', 'price_paid',
            'currency', 'start_at', 'end_at', 'paid_at', 'created_at',
        ]
        read_only_fields = fields

    def get_plan_name(self, obj):
        return _localized(obj.plan.name, _locale(self.context.get('request')))


class PurchaseSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    locale = serializers.CharField(required=False, default='en')

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
        except Plan.DoesNotExist:
            raise serializers.ValidationError('Plan not found') from None
        if plan.price <= 0:
            raise serializers.ValidationError('This plan is free')
        return plan

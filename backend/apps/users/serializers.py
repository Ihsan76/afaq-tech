from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.core.translations import get_translation

from .models import UserRole

User = get_user_model()


def _locale(request):
    if request is None:
        return 'en'
    if hasattr(request, 'query_params'):
        return request.query_params.get('locale', 'en')
    if hasattr(request, 'GET'):
        return request.GET.get('locale', 'en')
    return 'en'


class UserRoleSerializer(serializers.ModelSerializer):
    organization_name = serializers.SerializerMethodField()
    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ['id', 'user', 'role', 'organization', 'organization_name',
                  'assigned_by', 'assigned_by_name', 'assigned_at', 'is_active']
        read_only_fields = ['id', 'assigned_at']

    def get_organization_name(self, obj):
        return str(obj.organization) if obj.organization else None

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            loc = _locale(self.context.get('request'))
            return get_translation(obj.assigned_by.translations, loc, 'name', obj.assigned_by.email)
        return None


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'school_name', 'role', 'roles', 'subscription_plan', 'ui_language',
                  'is_verified', 'is_staff', 'phone', 'avatar', 'timezone', 'date_joined',
                  'preferred_currency',
                  'translations', 'points', 'badges', 'lessons_created_count']
        read_only_fields = ['id', 'date_joined', 'is_verified', 'points', 'badges', 'lessons_created_count']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.email)

    def get_school_name(self, obj):
        return getattr(obj, 'school_name', None) or ''


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password']

    def validate_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

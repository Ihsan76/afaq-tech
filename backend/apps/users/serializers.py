from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.core.translations import get_translation

User = get_user_model()


def _locale(request):
    if request is None:
        return 'en'
    if hasattr(request, 'query_params'):
        return request.query_params.get('locale', 'en')
    if hasattr(request, 'GET'):
        return request.GET.get('locale', 'en')
    return 'en'


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role', 'subscription_plan', 'ui_language',
                  'is_verified', 'is_staff', 'phone', 'avatar', 'timezone', 'date_joined',
                  'translations', 'points', 'badges', 'lessons_created_count']
        read_only_fields = ['id', 'date_joined', 'is_verified', 'points', 'badges', 'lessons_created_count']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.email)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

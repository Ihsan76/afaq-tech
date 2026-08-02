from rest_framework import serializers

from .models import FeatureFlag, Language, TranslationKey


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = [
            'id', 'code', 'name', 'native_name', 'flag', 'is_rtl',
            'is_active', 'is_default', 'order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class FeatureFlagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureFlag
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranslationKey
        fields = ['id', 'key', 'namespace', 'translations', 'is_active', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'namespace', 'created_at', 'updated_at']

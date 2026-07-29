from rest_framework import serializers
from .models import EbookCategory, Ebook


PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}


class EbookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EbookCategory
        fields = '__all__'


class EbookListSerializer(serializers.ModelSerializer):
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)

    class Meta:
        model = Ebook
        fields = ['id', 'slug', 'translations', 'cover_image', 'category', 'author_translations',
                  'pages_count', 'file_size', 'file_format', 'is_featured', 'is_published',
                  'access_level', 'access_level_display', 'download_count',
                  'related_service', 'tags', 'published_at', 'created_at']


class EbookDetailSerializer(serializers.ModelSerializer):
    access_level_display = serializers.CharField(source='get_access_level_display', read_only=True)
    can_download = serializers.SerializerMethodField()

    class Meta:
        model = Ebook
        fields = '__all__'

    def get_can_download(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return obj.access_level == 'free'
        user_level = PLAN_LEVELS.get(request.user.subscription_plan, 0)
        required_level = PLAN_LEVELS.get(obj.access_level, 0)
        return user_level >= required_level


class EbookCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ebook
        fields = '__all__'

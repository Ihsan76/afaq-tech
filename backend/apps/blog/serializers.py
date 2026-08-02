from rest_framework import serializers

from .models import BlogCategory, BlogPost


def _extract_field(translations_dict, field):
    """Extract a field from all locales: {ar: val, en: val, ...}"""
    if not translations_dict or not isinstance(translations_dict, dict):
        return {}
    return {
        locale: data.get(field, '')
        for locale, data in translations_dict.items()
        if isinstance(data, dict) and data.get(field)
    }


class BlogCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = BlogCategory
        fields = '__all__'

    def get_name(self, obj):
        return _extract_field(obj.translations, 'name')

    def get_description(self, obj):
        return _extract_field(obj.translations, 'description')

    def get_posts_count(self, obj):
        return obj.posts.filter(is_published=True).count()


class BlogPostListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt',
                  'featured_image', 'category', 'category_name', 'category_slug',
                  'tags', 'related_service', 'author_name',
                  'author_avatar', 'is_featured', 'is_published', 'read_time', 'views', 'published_at',
                  'translations']

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')

    def get_excerpt(self, obj):
        return _extract_field(obj.translations, 'excerpt')

    def get_author_name(self, obj):
        return _extract_field(obj.author_translations, 'author_name')

    def get_category_name(self, obj):
        if obj.category:
            return _extract_field(obj.category.translations, 'name')
        return None

    def get_category_slug(self, obj):
        return obj.category.slug if obj.category else None


class BlogPostDetailSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    excerpt = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = '__all__'

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')

    def get_excerpt(self, obj):
        return _extract_field(obj.translations, 'excerpt')

    def get_content(self, obj):
        return _extract_field(obj.translations, 'content')

    def get_author_name(self, obj):
        return _extract_field(obj.author_translations, 'author_name')

    def get_category_name(self, obj):
        if obj.category:
            return _extract_field(obj.category.translations, 'name')
        return None

    def get_category_slug(self, obj):
        return obj.category.slug if obj.category else None


class BlogPostCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        exclude = ['views']

from rest_framework import serializers

from apps.core.translations import get_translation

from .models import (
    ContactMessage,
    MenuItem,
    NewsletterSubscriber,
    Page,
    PageBlock,
    PageTemplate,
    SiteSettings,
)


def _locale(request):
    if request is None:
        return 'en'
    if hasattr(request, 'query_params'):
        return request.query_params.get('locale', 'en')
    if hasattr(request, 'GET'):
        return request.GET.get('locale', 'en')
    return 'en'


# ── Page ──

class PageBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageBlock
        fields = '__all__'


class PageListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    blocks_count = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = ['id', 'slug', 'title', 'description', 'translations', 'template', 'is_published',
                  'is_homepage', 'show_in_nav', 'nav_order', 'nav_icon', 'blocks_count',
                  'created_at', 'updated_at']

    def get_title(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'title', obj.slug)

    def get_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'description', '')

    def get_blocks_count(self, obj):
        return obj.blocks.count()


class PageDetailSerializer(serializers.ModelSerializer):
    blocks = PageBlockSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = '__all__'


class PageCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = '__all__'


# ── PageBlock ──

class BlockSerializer(serializers.ModelSerializer):
    block_type_display = serializers.CharField(source='get_block_type_display', read_only=True)

    class Meta:
        model = PageBlock
        fields = '__all__'


class BlockCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageBlock
        exclude = ['page']


# ── MenuItem ──

class MenuItemSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    resolved_url = serializers.ReadOnlyField()

    class Meta:
        model = MenuItem
        fields = '__all__'

    def get_title(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'title', '')

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('order')
        return MenuItemSerializer(children, many=True, context=self.context).data


class MenuItemListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    resolved_url = serializers.ReadOnlyField()
    children_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = ['id', 'menu', 'title', 'url', 'page', 'icon',
                  'parent', 'order', 'is_active', 'open_in_new', 'badge',
                  'resolved_url', 'children_count', 'translations']

    def get_title(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'title', '')

    def get_children_count(self, obj):
        return obj.children.count()


class MenuItemCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'


# ── PageTemplate ──

class PageTemplateSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = PageTemplate
        fields = '__all__'

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.slug)

    def get_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'description', '')


class PageTemplateListSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = PageTemplate
        fields = ['id', 'name', 'slug', 'description',
                  'thumbnail', 'category', 'is_active', 'created_at', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.slug)

    def get_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'description', '')


# ── SiteSettings ──

class SiteSettingsSerializer(serializers.ModelSerializer):
    site_name = serializers.SerializerMethodField()
    site_description = serializers.SerializerMethodField()
    footer_text = serializers.SerializerMethodField()

    class Meta:
        model = SiteSettings
        fields = '__all__'

    def get_site_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'site_name', '')

    def get_site_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'site_description', obj.site_description_en or obj.site_description_ar or '')

    def get_footer_text(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.footer_translations, loc, 'footer_text', '')


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'phone', 'subject', 'message', 'service_interest']


class ContactMessageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'


class NewsletterSubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['email', 'name', 'locale']


class NewsletterSubscriberListSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = '__all__'

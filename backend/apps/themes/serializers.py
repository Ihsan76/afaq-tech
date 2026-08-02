from rest_framework import serializers

from apps.core.translations import get_translation

from .models import Theme


def _locale(request):
    if request is None:
        return 'en'
    if hasattr(request, 'query_params'):
        return request.query_params.get('locale', 'en')
    if hasattr(request, 'GET'):
        return request.GET.get('locale', 'en')
    return 'en'


class ThemeSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    display_description = serializers.SerializerMethodField()

    class Meta:
        model = Theme
        fields = [
            'id', 'display_name', 'display_description', 'icon',
            'is_active', 'is_default', 'order', 'translations',
            'primary', 'secondary', 'accent', 'success', 'error', 'warning',
            'background', 'surface', 'surface_alt',
            'text_color', 'text_secondary', 'text_muted',
            'border_color', 'border_light', 'muted',
            'btn_shape', 'btn_size', 'btn_shadow', 'btn_hover',
            'card_radius', 'card_border', 'card_shadow', 'card_glass',
            'font_heading', 'font_body', 'font_size', 'line_height',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_display_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.name or '')

    def get_display_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'description', obj.description or '')


class ThemeListSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    display_description = serializers.SerializerMethodField()

    class Meta:
        model = Theme
        fields = [
            'id', 'display_name', 'display_description', 'icon',
            'is_active', 'is_default', 'order',
            'primary', 'secondary', 'accent', 'background',
            'translations',
        ]

    def get_display_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', obj.name or '')

    def get_display_description(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'description', obj.description or '')

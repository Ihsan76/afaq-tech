from django.contrib import admin

from .models import Theme


@admin.register(Theme)
class ThemeAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'is_active', 'is_default', 'order']
    list_filter = ['is_active', 'is_default']
    list_editable = ['is_active', 'is_default', 'order']
    search_fields = ['name']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'icon', 'description', 'order', 'is_active', 'is_default')
        }),
        ('Colors', {
            'fields': (
                'primary', 'secondary', 'accent', 'success', 'error', 'warning',
                'background', 'surface', 'surface_alt',
                'text_color', 'text_secondary', 'text_muted',
                'border_color', 'border_light', 'muted',
            )
        }),
        ('Buttons', {
            'fields': ('btn_shape', 'btn_size', 'btn_shadow', 'btn_hover')
        }),
        ('Cards', {
            'fields': ('card_radius', 'card_border', 'card_shadow', 'card_glass')
        }),
        ('Fonts', {
            'fields': ('font_heading', 'font_body', 'font_size', 'line_height')
        }),
    )

from django.db import models


class Theme(models.Model):
    class Shape(models.TextChoices):
        ROUNDED = 'rounded', 'مدوّر'
        PILL = 'pill', 'كبسولة'
        SQUARE = 'square', 'مربع'

    class Shadow(models.TextChoices):
        NONE = 'none', 'بدون'
        SM = 'sm', 'خفيف'
        MD = 'md', 'متوسط'
        LG = 'lg', 'كبير'

    class HoverEffect(models.TextChoices):
        NONE = 'none', 'بدون'
        SCALE = 'scale', 'تكبير'
        SHADOW = 'shadow', 'ظل'
        GLOW = 'glow', 'توهّج'

    class BorderRadius(models.TextChoices):
        NONE = 'none', 'بدون'
        SM = 'sm', 'صغير'
        MD = 'md', 'متوسط'
        LG = 'lg', 'كبير'
        FULL = 'full', 'دائري'

    # Basic info
    name = models.CharField('Name', max_length=100)
    icon = models.CharField('Icon', max_length=10, default='🎨')
    description = models.CharField('Description', max_length=255, blank=True)
    translations = models.JSONField('Translations', default=dict, blank=True)

    is_active = models.BooleanField('نشط', default=True)
    is_default = models.BooleanField('افتراضي', default=False)
    order = models.IntegerField('الترتيب', default=0)

    # Colors
    primary = models.CharField('اللون الرئيسي', max_length=7, default='#4F46E5')
    secondary = models.CharField('اللون الثانوي', max_length=7, default='#7C3AED')
    accent = models.CharField('اللون المميز', max_length=7, default='#6366F1')
    success = models.CharField('لون النجاح', max_length=7, default='#10B981')
    error = models.CharField('لون الخطأ', max_length=7, default='#EF4444')
    warning = models.CharField('لون التحذير', max_length=7, default='#F59E0B')
    background = models.CharField('لون الخلفية', max_length=7, default='#F8FAFC')
    surface = models.CharField('لون السطح', max_length=7, default='#FFFFFF')
    surface_alt = models.CharField('لون السطح البديل', max_length=7, default='#F1F5F9')
    text_color = models.CharField('لون النص', max_length=7, default='#0F172A')
    text_secondary = models.CharField('لون النص الثانوي', max_length=7, default='#475569')
    text_muted = models.CharField('لون النص الخافت', max_length=7, default='#94A3B8')
    border_color = models.CharField('لون الحدود', max_length=7, default='#E2E8F0')
    border_light = models.CharField('لون الحدود الفاتح', max_length=7, default='#F1F5F9')
    muted = models.CharField('اللون الخافت', max_length=7, default='#F1F5F9')

    # Buttons
    btn_shape = models.CharField('شكل الأزرار', max_length=10, choices=Shape.choices, default=Shape.ROUNDED)
    btn_size = models.CharField('حجم الأزرار', max_length=5, default='md')
    btn_shadow = models.CharField('ظل الأزرار', max_length=5, choices=Shadow.choices, default=Shadow.MD)
    btn_hover = models.CharField('تأثير Hover', max_length=10, choices=HoverEffect.choices, default=HoverEffect.SCALE)

    # Cards
    card_radius = models.CharField('زوايا البطاقات', max_length=10, choices=BorderRadius.choices, default=BorderRadius.LG)
    card_border = models.CharField('حدود البطاقات', max_length=10, default='thin')
    card_shadow = models.CharField('ظل البطاقات', max_length=5, choices=Shadow.choices, default=Shadow.MD)
    card_glass = models.BooleanField('تأثير Glass', default=True)

    # Fonts
    font_heading = models.CharField('خط العناوين', max_length=200, default="'IBM Plex Sans Arabic', sans-serif")
    font_body = models.CharField('خط النص', max_length=200, default="'Noto Sans Arabic', sans-serif")
    font_size = models.CharField('حجم الخط', max_length=10, default='16px')
    line_height = models.CharField('ارتفاع السطر', max_length=10, default='1.6')

    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'ثيم'
        verbose_name_plural = 'الثيمات'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.icon} {self.translations.get('ar', {}).get('name', self.name)}"

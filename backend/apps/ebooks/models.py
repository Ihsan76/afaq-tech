from django.db import models


class EbookCategory(models.Model):
    """تصنيف الكتب الإلكترونية"""
    slug = models.SlugField(unique=True, max_length=100)
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    icon = models.CharField('الأيقونة', max_length=10, default='📚')
    order = models.IntegerField('الترتيب', default=0)
    is_active = models.BooleanField('نشط', default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'slug']
        verbose_name = 'تصنيف كتاب'
        verbose_name_plural = 'تصنيفات الكتب'

    def __str__(self):
        return self.translations.get('ar', {}).get('name', self.slug)


class Ebook(models.Model):
    """كتاب إلكتروني"""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'مسودة'
        PUBLISHED = 'published', 'منشور'
        ARCHIVED = 'archived', 'مؤرشف'

    class AccessLevel(models.TextChoices):
        FREE = 'free', 'مجاني'
        BASIC = 'basic', 'أساسي'
        PRO = 'pro', 'برو'
        ENTERPRISE = 'enterprise', 'مؤسسي'

    slug = models.SlugField(unique=True, max_length=200)
    translations = models.JSONField('الترجمات', default=dict, blank=True)

    category = models.ForeignKey(EbookCategory, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='ebooks', verbose_name='التصنيف')

    cover_image = models.URLField('صورة الغلاف', blank=True, default='')
    file_url = models.URLField('رابط الملف', blank=True, default='')
    preview_url = models.URLField('رابط المعاينة', blank=True, default='')

    author_translations = models.JSONField('ترجمات المؤلف', default=dict, blank=True)
    author_avatar = models.URLField('صورة المؤلف', blank=True, default='')

    pages_count = models.IntegerField('عدد الصفحات', default=0)
    file_size = models.CharField('حجم الملف', max_length=50, blank=True, default='')
    file_format = models.CharField('صيغة الملف', max_length=20, default='PDF')

    is_published = models.BooleanField('منشور', default=False)
    is_featured = models.BooleanField('مميز', default=False)
    access_level = models.CharField('مستوى الوصول', max_length=20, choices=AccessLevel.choices, default=AccessLevel.FREE)
    download_count = models.IntegerField('عدد التحميلات', default=0)

    related_service = models.CharField('رابط الخدمة المرتبطة', max_length=200, blank=True, default='')
    tags = models.CharField('الوسوم', max_length=500, blank=True, default='')

    published_at = models.DateTimeField('تاريخ النشر', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        verbose_name = 'كتاب إلكتروني'
        verbose_name_plural = 'الكتب الإلكترونية'

    def __str__(self):
        return self.translations.get('ar', {}).get('title', self.slug)

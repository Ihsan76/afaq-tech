from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


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
    author_role = models.ForeignKey(
        'users.UserRole', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='authored_ebooks', verbose_name=_('Author Role')
    )

    pages_count = models.IntegerField('عدد الصفحات', default=0)
    file_size = models.CharField('حجم الملف', max_length=50, blank=True, default='')
    file_format = models.CharField('صيغة الملف', max_length=20, default='PDF')

    is_published = models.BooleanField('منشور', default=False)
    is_featured = models.BooleanField('مميز', default=False)
    access_level = models.CharField('مستوى الوصول', max_length=20, choices=AccessLevel.choices, default=AccessLevel.FREE)
    is_free = models.BooleanField('مجاني', default=True)
    price = models.DecimalField('السعر', max_digits=8, decimal_places=2, default=0)
    platform_fee_percent = models.DecimalField(
        'رسوم المنصة %', max_digits=4, decimal_places=1, default=10,
        help_text='نسبة رسوم المنصة من سعر الشراء، والباقي للمؤلف',
    )
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

    @property
    def author(self):
        return self.author_role.user if self.author_role else None

    @property
    def author_id(self):
        return self.author_role.user_id if self.author_role else None


class EbookPurchase(models.Model):
    """شراء كتاب لمرة واحدة — وصول مدى الحياة"""

    kind = 'ebook_purchase'

    class Status(models.TextChoices):
        PENDING = 'pending', 'قيد الانتظار'
        PAID = 'paid', 'مدفوع'
        REFUNDED = 'refunded', 'مسترد'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ebook_purchases')
    ebook = models.ForeignKey(Ebook, on_delete=models.CASCADE, related_name='purchases')

    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_provider = models.CharField('مزوّد الدفع', max_length=32, blank=True, default='')
    payment_session_id = models.CharField('معرّف الجلسة', max_length=255, blank=True, default='')
    payment_transaction_id = models.CharField('معرّف العملية', max_length=255, blank=True, default='')

    price_paid = models.DecimalField('المبلغ المدفوع', max_digits=10, decimal_places=2)
    currency = models.CharField('العملة', max_length=3, default='JOD')
    display_price = models.DecimalField('السعر المعروض', max_digits=10, decimal_places=2, default=0)
    display_currency = models.CharField('عملة العرض', max_length=3, default='JOD')

    purchased_at = models.DateTimeField('تاريخ الشراء', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'شراء كتاب'
        verbose_name_plural = 'مشتريات الكتب'
        unique_together = ['user', 'ebook']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.ebook.slug} [{self.status}]'

    @property
    def buyer(self):
        return self.user

    @property
    def title(self):
        return self.ebook.translations

from django.db import models
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        abstract = True

class Language(TimeStampedModel):
    code = models.CharField('رمز اللغة', max_length=10, unique=True)
    name = models.CharField('اسم اللغة (إنجليزي)', max_length=100)
    native_name = models.CharField('اسم اللغة بالعربية', max_length=100, blank=True)
    flag = models.CharField('العلم', max_length=20, blank=True)
    is_rtl = models.BooleanField('اتجاه من اليمين لليسار', default=False)
    is_active = models.BooleanField('مفعلة', default=True)
    is_default = models.BooleanField('الافتراضية', default=False)
    order = models.IntegerField('الترتيب', default=0)

    class Meta:
        verbose_name = _('Language')
        verbose_name_plural = _('Languages')
        ordering = ['order', 'code']

    def save(self, *args, **kwargs):
        if self.is_default:
            Language.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.native_name or self.name} ({self.code})"

class FeatureFlag(TimeStampedModel):
    key = models.CharField('مفتاح الميزة', max_length=100, unique=True)
    name = models.CharField('اسم الميزة', max_length=200)
    is_active = models.BooleanField('مفعلة', default=True)
    description = models.TextField('الوصف', blank=True)

    class Meta:
        verbose_name = 'ميزة النظام'
        verbose_name_plural = 'ميزات النظام (Feature Flags)'

    def __str__(self):
        return f"{self.name} ({'مفعل' if self.is_active else 'معطل'})"


class TranslationKey(TimeStampedModel):
    """مفتاح ترجمة لواجهة الموقع — القيمة لكل لغة"""

    key = models.CharField('المفتاح', max_length=200, unique=True)
    namespace = models.CharField('النطاق', max_length=100, blank=True, default='')
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    is_active = models.BooleanField('مفعل', default=True)
    order = models.IntegerField('الترتيب', default=0)

    class Meta:
        verbose_name = 'مفتاح ترجمة'
        verbose_name_plural = 'مفاتيح الترجمة'
        ordering = ['order', 'key']

    def save(self, *args, **kwargs):
        if '.' in self.key:
            self.namespace = self.key.split('.')[0]
        else:
            self.namespace = 'root'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.key


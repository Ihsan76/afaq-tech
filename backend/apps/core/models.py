from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        abstract = True

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


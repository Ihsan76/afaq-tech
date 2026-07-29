from django.db import models
from django.conf import settings

class LessonPlan(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'مسودة'
        PUBLISHED = 'published', 'منشور'
        ARCHIVED = 'archived', 'أرشيف'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_plans')
    title = models.CharField('العنوان', max_length=255)
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, related_name='lesson_plans')
    grade = models.ForeignKey('academics.Grade', on_delete=models.SET_NULL, null=True, related_name='lesson_plans')
    plan_data = models.JSONField('بيانات الخطة')
    generated_by = models.CharField('مولّد بواسطة', max_length=10, default='ai')
    ai_model_used = models.CharField('نموذج AI المستخدم', max_length=100, blank=True)
    status = models.CharField('الحالة', max_length=15, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'خطة درس'
        verbose_name_plural = 'خطط الدروس'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

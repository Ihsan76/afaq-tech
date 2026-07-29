from django.db import models
from django.conf import settings


class AIRun(models.Model):
    class Feature(models.TextChoices):
        LESSON_PLAN = 'lesson_plan', 'خطة درس'
        QUIZ = 'quiz', 'اختبار'
        EXPLANATION = 'exploration', 'شرح'
        CHAT = 'chat', 'محادثة'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_runs')
    feature = models.CharField('الميزة', max_length=20, choices=Feature.choices)
    prompt = models.TextField('الاستعلام')
    response = models.TextField('الاستجابة', blank=True)
    model_used = models.CharField('النموذج', max_length=100)
    tokens_used = models.IntegerField('الرموز المستخدمة', default=0)
    cost = models.DecimalField('التكلفة', max_digits=10, decimal_places=6, default=0)
    duration_ms = models.IntegerField('المدة بالمللي ثانية', default=0)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'تشغيل AI'
        verbose_name_plural = 'تشغيلات AI'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.feature} - {self.model_used}"


class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField('العنوان', max_length=255, blank=True, default='')
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'محادثة'
        verbose_name_plural = 'المحادثات'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f'محادثة #{self.id}'


class Message(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'مستخدم'
        ASSISTANT = 'assistant', 'مساعد'
        SYSTEM = 'system', 'نظام'

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField('الدور', max_length=20, choices=Role.choices)
    content = models.TextField('المحتوى')
    tokens = models.IntegerField('الرموز', default=0)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'رسالة'
        verbose_name_plural = 'الرسائل'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"


class AIModel(models.Model):
    class Provider(models.TextChoices):
        GOOGLE = 'google', 'Google Gemini'

    provider = models.CharField('المزود', max_length=50, choices=Provider.choices, default=Provider.GOOGLE)
    model_id = models.CharField('معرف النموذج', max_length=100, help_text='e.g. gemini-3.6-flash')
    name_ar = models.CharField('الاسم (عربي)', max_length=100)
    name_en = models.CharField('الاسم (إنجليزي)', max_length=100)
    description_ar = models.TextField('الوصف (عربي)', blank=True, default='')
    description_en = models.TextField('الوصف (إنجليزي)', blank=True, default='')
    is_active = models.BooleanField('مفعل', default=True)
    is_default = models.BooleanField('افتراضي', default=False)
    max_tokens = models.IntegerField('الحد الأقصى للرموز', default=4096)
    sort_order = models.IntegerField('ترتيب', default=0)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'نموذج AI'
        verbose_name_plural = 'نماذج AI'
        ordering = ['sort_order', 'name_ar']

    def __str__(self):
        return f"{self.name_ar} ({self.model_id})"

    def save(self, *args, **kwargs):
        if self.is_default:
            AIModel.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

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


class ProviderType(models.Model):
    code = models.CharField('الرمز', max_length=50, unique=True, help_text='e.g. google, openai, ollama')
    name_ar = models.CharField('الاسم (عربي)', max_length=100)
    name_en = models.CharField('الاسم (إنجليزي)', max_length=100)
    needs_base_url = models.BooleanField('يتطلب رابط API', default=False)
    default_base_url = models.CharField('الرابط الافتراضي', max_length=500, blank=True, default='')
    needs_api_key = models.BooleanField('يتطلب مفتاح API', default=True)
    supports_fetching = models.BooleanField('يدعم جلب النماذج', default=True)
    sort_order = models.IntegerField('ترتيب', default=0)
    is_active = models.BooleanField('مفعل', default=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'نوع المزود'
        verbose_name_plural = 'أنواع المزودين'
        ordering = ['sort_order', 'name_ar']

    def __str__(self):
        return self.name_ar


class AIProvider(models.Model):
    name = models.CharField('الاسم', max_length=100)
    provider_type = models.ForeignKey(ProviderType, on_delete=models.PROTECT, verbose_name='نوع المزود', related_name='providers', null=True)
    base_url = models.CharField('رابط API', max_length=500, blank=True, default='')
    encrypted_api_key = models.TextField('مفتاح API مشفر', blank=True, default='')
    is_active = models.BooleanField('مفعل', default=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'مزود AI'
        verbose_name_plural = 'مزودو AI'
        ordering = ['name']

    def __str__(self):
        return self.name

    def set_api_key(self, raw_key: str):
        from .utils import encrypt_api_key
        self.encrypted_api_key = encrypt_api_key(raw_key)

    def get_api_key(self) -> str:
        from .utils import decrypt_api_key
        return decrypt_api_key(self.encrypted_api_key)


class AIModel(models.Model):
    provider = models.CharField('المزود', max_length=50, db_index=True)
    model_id = models.CharField('معرف النموذج', max_length=100, help_text='e.g. gemini-3.6-flash')
    name_ar = models.CharField('الاسم (عربي)', max_length=100, blank=True, default='')
    name_en = models.CharField('الاسم (إنجليزي)', max_length=100, blank=True, default='')
    description_ar = models.TextField('الوصف (عربي)', blank=True, default='')
    description_en = models.TextField('الوصف (إنجليزي)', blank=True, default='')
    name = models.JSONField('الاسم (متعدد اللغات)', default=dict, blank=True)
    description = models.JSONField('الوصف (متعدد اللغات)', default=dict, blank=True)
    is_active = models.BooleanField('مفعل', default=True)
    is_default = models.BooleanField('افتراضي', default=False)
    max_tokens = models.IntegerField('الحد الأقصى للرموز', default=4096)
    sort_order = models.IntegerField('ترتيب', default=0)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'نموذج AI'
        verbose_name_plural = 'نماذج AI'
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.name.get('ar', self.name_ar)} ({self.model_id})"

    def save(self, *args, **kwargs):
        if self.is_default:
            AIModel.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class EducationStageChoices(models.TextChoices):
    EARLY_PRIMARY = "early_primary", "الصف الأول الأساسي المبكر"
    PRIMARY = "primary", "المرحلة الأساسية"
    MIDDLE = "middle", "المرحلة المتوسطة"
    SECONDARY = "secondary", "المرحلة الثانوية"
    UNIVERSITY = "university", "الجامعية"
    PROFESSIONAL = "professional", "مهني"


class PromptTemplate(models.Model):
    name = models.CharField('اسم القالب', max_length=255)
    feature_key = models.CharField('مفتاح الخدمة', max_length=50, default='lesson_plan', db_index=True)
    language = models.CharField('اللغة', max_length=10, default='ar', db_index=True)
    learner_stage = models.CharField('المرحلة التعليمية', max_length=32, choices=EducationStageChoices.choices, blank=True, default='')
    subject = models.ForeignKey('academics.Subject', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='المادة')
    curriculum = models.ForeignKey('academics.Curriculum', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='المنهاج')
    template_body = models.TextField('نص البرومبت (Template)')
    priority = models.IntegerField('الأولوية', default=0, help_text='كلما زاد الرقم كانت الأولوية أعلى عند تساوي التخصص')
    is_default = models.BooleanField('قالب افتراضي', default=False)
    is_active = models.BooleanField('مفعل', default=True)
    version = models.IntegerField('الإصدار', default=1)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)
    updated_at = models.DateTimeField('تاريخ التحديث', auto_now=True)

    class Meta:
        verbose_name = 'قالب برومبت الذكاء الاصطناعي'
        verbose_name_plural = 'قوالب برومبت الذكاء الاصطناعي'
        ordering = ['-priority', '-updated_at']

    def __str__(self):
        return f"{self.name} ({self.feature_key} - {self.language})"

    def save(self, *args, **kwargs):
        if self.is_default:
            PromptTemplate.objects.filter(
                feature_key=self.feature_key,
                language=self.language,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

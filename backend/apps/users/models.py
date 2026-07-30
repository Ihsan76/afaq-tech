from django.contrib.auth.models import AbstractUser
from django.db import models
from .managers import UserManager

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', 'طالب'
        TEACHER = 'teacher', 'معلم'
        CONTENT_CREATOR = 'creator', 'منشئ محتوى'
        ADMIN = 'admin', 'مدير'

    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', 'مجاني'
        BASIC = 'basic', 'أساسي'
        PRO = 'pro', 'برو'
        ENTERPRISE = 'enterprise', 'مؤسسي'

    PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}

    email = models.EmailField(unique=True)
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    role = models.CharField('الدور', max_length=20, choices=Role.choices, default=Role.STUDENT)
    subscription_plan = models.CharField('باقة الاشتراك', max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE)
    
    ui_language = models.CharField('لغة الواجهة', max_length=5, default='ar')
    input_language = models.CharField('لغة الإدخال', max_length=5, default='ar')
    output_language = models.CharField('لغة الإخراج', max_length=5, default='ar')
    source_locale = models.CharField(max_length=10, default='jo')
    
    is_verified = models.BooleanField('موثق', default=False)
    phone = models.CharField('الهاتف', max_length=20, blank=True)
    avatar = models.URLField('الصورة', blank=True)
    timezone = models.CharField('المنطقة الزمنية', max_length=50, default='Asia/Amman')
    
    # Gamification
    points = models.IntegerField('النقاط', default=0)
    badges = models.JSONField('الشارات', default=list, blank=True)
    lessons_created_count = models.IntegerField('عدد الخطط المنشأة', default=0)

    
    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'المستخدمون'

    def __str__(self):
        return self.translations.get('ar', {}).get('name', self.email)

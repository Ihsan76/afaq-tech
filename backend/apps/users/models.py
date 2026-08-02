from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', _('Student')
        TEACHER = 'teacher', _('Teacher')
        CONTENT_CREATOR = 'creator', _('Content Creator')
        ADMIN = 'admin', _('Admin')

    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        BASIC = 'basic', _('Basic')
        PRO = 'pro', _('Pro')
        ENTERPRISE = 'enterprise', _('Enterprise')

    PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}

    email = models.EmailField(unique=True)
    translations = models.JSONField(_('Translations'), default=dict, blank=True)
    role = models.CharField(_('Role'), max_length=20, choices=Role.choices, default=Role.STUDENT)
    subscription_plan = models.CharField(_('Subscription Plan'), max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE)

    ui_language = models.CharField(_('UI Language'), max_length=5, default='ar')
    input_language = models.CharField(_('Input Language'), max_length=5, default='ar')
    output_language = models.CharField(_('Output Language'), max_length=5, default='ar')
    source_locale = models.CharField(max_length=10, default='jo')

    is_verified = models.BooleanField(_('Verified'), default=False)
    phone = models.CharField(_('Phone'), max_length=20, blank=True)
    avatar = models.URLField(_('Avatar'), blank=True)
    timezone = models.CharField(_('Timezone'), max_length=50, default='Asia/Amman')

    # Gamification
    points = models.IntegerField(_('Points'), default=0)
    badges = models.JSONField(_('Badges'), default=list, blank=True)
    lessons_created_count = models.IntegerField(_('Lessons Created'), default=0)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')

    def __str__(self):
        return self.translations.get('ar', {}).get('name', self.email)


class EmailVerification(models.Model):
    """Short-lived verification code sent to the user's email."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications')
    code_hash = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, default='verify_email')
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Email Verification')
        verbose_name_plural = _('Email Verifications')

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()


class LoginAttempt(models.Model):
    """Tracks login failures for brute-force lockout."""
    email = models.CharField(max_length=255, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    successful = models.BooleanField(default=False)
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Login Attempt')
        verbose_name_plural = _('Login Attempts')
        indexes = [models.Index(fields=['email', 'attempted_at'])]

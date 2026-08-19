from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = 'student', _('Student')
        USER = 'user', _('General User')
        TEACHER = 'teacher', _('Teacher')
        INSTRUCTOR = 'instructor', _('Instructor')
        PARENT = 'parent', _('Parent')
        CONTENT_CREATOR = 'creator', _('Content Creator')
        ADMIN = 'admin', _('System Admin')
        SCHOOL_ADMIN = 'school_admin', _('School Admin')
        SCHOOL_ACCOUNTANT = 'school_accountant', _('School Accountant')
        SCHOOL_TRANSPORT_OFFICER = 'school_transport_officer', _('School Transport Officer')
        SCHOOL_LIBRARIAN = 'school_librarian', _('School Librarian')
        DEVELOPER = 'developer', _('Developer')
        SUPPORT = 'support', _('Support')
        CONTENT_MANAGER = 'content_manager', _('Content Manager')
        FINANCE = 'finance', _('Finance')

    # Roles allowed to enter the admin dashboard (system admin + dev team)
    ADMIN_ROLES = (
        Role.ADMIN, Role.DEVELOPER, Role.SUPPORT,
        Role.CONTENT_MANAGER, Role.FINANCE,
    )

    class SubscriptionPlan(models.TextChoices):
        FREE = 'free', _('Free')
        BASIC = 'basic', _('Basic')
        PRO = 'pro', _('Pro')
        SCHOOL = 'school', _('School')
        ENTERPRISE = 'enterprise', _('Enterprise')

    PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'school': 2, 'enterprise': 3}

    def get_subscription_level(self):
        """Returns the effective plan level, checking active Subscription records."""
        base_level = self.PLAN_LEVELS.get(self.subscription_plan, 0)
        try:
            from django.utils import timezone

            from apps.subscriptions.models import Subscription
            now = timezone.now()
            active_codes = Subscription.objects.filter(
                user=self,
                status=Subscription.Status.ACTIVE,
                end_at__gte=now
            ).select_related('plan').values_list('plan__code', flat=True)
            for code in active_codes:
                lvl = self.PLAN_LEVELS.get(code, 0)
                if lvl > base_level:
                    base_level = lvl
        except Exception:
            pass
        return base_level

    email = models.EmailField(unique=True)
    translations = models.JSONField(_('Translations'), default=dict, blank=True)
    role = models.CharField(_('Role'), max_length=32, choices=Role.choices, default=Role.USER)
    roles = models.JSONField(_('All Roles'), default=list, blank=True,
                             help_text=_('List of all roles this user has. e.g. ["teacher", "instructor"]'))
    subscription_plan = models.CharField(_('Subscription Plan'), max_length=20, choices=SubscriptionPlan.choices, default=SubscriptionPlan.FREE)

    ui_language = models.CharField(_('UI Language'), max_length=5, default='ar')
    input_language = models.CharField(_('Input Language'), max_length=5, default='ar')
    output_language = models.CharField(_('Output Language'), max_length=5, default='ar')
    source_locale = models.CharField(max_length=10, default='jo')
    preferred_currency = models.CharField(_('Preferred Currency'), max_length=3, blank=True, default='')

    is_verified = models.BooleanField(_('Verified'), default=False)
    phone_verified = models.BooleanField(_('Phone Verified'), default=False)
    phone = models.CharField(_('Phone'), max_length=20, blank=True)
    national_id = models.CharField(_('National ID'), max_length=30, blank=True, null=True, unique=True)
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


class PhoneVerification(models.Model):
    """Short-lived verification code sent to the user's phone via SMS or WhatsApp."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_verifications')
    phone = models.CharField(max_length=20)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Phone Verification')
        verbose_name_plural = _('Phone Verifications')

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


class UserRole(models.Model):
    """A role assignment for a user within a specific context (global or organization-scoped)."""

    class Meta:
        unique_together = ('user', 'role', 'organization')
        verbose_name = _('User Role')
        verbose_name_plural = _('User Roles')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_roles',
        verbose_name=_('User')
    )
    role = models.CharField(
        _('Role'),
        max_length=32,
        choices=User.Role.choices
    )
    organization = models.ForeignKey(
        'subscriptions.Organization',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='user_roles',
        verbose_name=_('Organization'),
        help_text=_('Leave empty for global roles (admin, instructor, provider)')
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_roles',
        verbose_name=_('Assigned By')
    )
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Assigned At'))
    is_active = models.BooleanField(default=True, verbose_name=_('Is Active'))

    def __str__(self):
        org = f" @ {self.organization}" if self.organization else " (global)"
        return f"{self.user} → {self.role}{org}"


class RoleRequest(models.Model):
    """Request to obtain a platform role (instructor, publisher, provider)."""

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')

    class RequestType(models.TextChoices):
        INSTRUCTOR = 'instructor', _('Instructor / Trainer')
        PUBLISHER = 'publisher', _('Publisher')
        PROVIDER = 'provider', _('Service Provider')

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='role_requests')
    request_type = models.CharField(max_length=20, choices=RequestType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    privacy_policy_accepted = models.BooleanField(default=False)
    content_ownership_confirmed = models.BooleanField(default=False)
    platform_rights_granted = models.BooleanField(default=False)
    legal_review_acknowledged = models.BooleanField(default=False)

    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    payment_terms = models.TextField(blank=True, default='')

    admin_notes = models.TextField(blank=True, default='')
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_role_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Role Request'
        verbose_name_plural = 'Role Requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} → {self.request_type} [{self.status}]"

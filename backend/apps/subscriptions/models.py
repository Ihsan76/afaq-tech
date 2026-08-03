from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Plan(models.Model):
    class BillingPeriod(models.TextChoices):
        MONTHLY = 'monthly', _('Monthly')
        YEARLY = 'yearly', _('Yearly')

    code = models.SlugField(_('Code'), max_length=50, unique=True)
    name = models.JSONField(_('Name (Multilingual)'), default=dict)
    description = models.JSONField(_('Description (Multilingual)'), default=dict)
    price = models.DecimalField(_('Price'), max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(_('Currency'), max_length=3, default='SAR')
    prices = models.JSONField(
        _('Prices per Currency'), default=dict, blank=True,
        help_text='Per-currency display prices, e.g. {"SAR": "9.99", "JOD": "1.90", "USD": "2.66"}. '
                  'The gateway always charges in the account currency.',
    )
    billing_period = models.CharField(
        _('Billing Period'), max_length=20, choices=BillingPeriod.choices, default=BillingPeriod.MONTHLY
    )
    duration_days = models.IntegerField(_('Duration (days)'), default=30)
    seats = models.PositiveIntegerField(
        _('Teacher Seats'), default=0,
        help_text='Number of teacher seats included in the base price (school/enterprise plans).',
    )
    extra_seat_price = models.DecimalField(
        _('Extra Seat Price'), max_digits=10, decimal_places=2, default=0,
        help_text='Price per additional teacher seat beyond the included seats (0 disables extra seats).',
    )
    level = models.IntegerField(
        _('Access Level'), default=0, help_text='0=free, 1=basic, 2=pro/school, 3=enterprise'
    )
    features = models.JSONField(_('Features (Multilingual)'), default=list, blank=True)
    is_active = models.BooleanField(_('Active'), default=True)
    is_featured = models.BooleanField(_('Featured'), default=False)
    sort_order = models.IntegerField(_('Sort Order'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Plan')
        verbose_name_plural = _('Plans')
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name.get('ar') or self.name.get('en') or self.code

    def get_price(self, currency=''):
        """Resolve the display price for a currency, falling back to the base price."""
        currency = (currency or self.currency or '').upper()
        if self.prices and currency in self.prices:
            try:
                return Decimal(str(self.prices[currency])), currency
            except (TypeError, ValueError, InvalidOperation):
                pass
        return self.price, self.currency


class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        ACTIVE = 'active', _('Active')
        EXPIRED = 'expired', _('Expired')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')

    kind = 'subscription'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_provider = models.CharField(_('Payment Provider'), max_length=32, blank=True, default='')
    payment_session_id = models.CharField(_('Payment Session ID'), max_length=255, blank=True, default='')
    payment_transaction_id = models.CharField(_('Payment Transaction ID'), max_length=255, blank=True, default='')
    price_paid = models.DecimalField(_('Price Paid'), max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(_('Currency'), max_length=3, default='SAR')
    display_price = models.DecimalField(_('Display Price'), max_digits=10, decimal_places=2, default=0)
    display_currency = models.CharField(_('Display Currency'), max_length=3, blank=True, default='')
    start_at = models.DateTimeField(_('Started At'), null=True, blank=True)
    end_at = models.DateTimeField(_('Ends At'), null=True, blank=True)
    paid_at = models.DateTimeField(_('Paid At'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Subscription')
        verbose_name_plural = _('Subscriptions')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.plan} ({self.status})"


class PlanService(models.Model):
    class Period(models.TextChoices):
        DAILY = 'daily', _('Daily')
        MONTHLY = 'monthly', _('Monthly')
        YEARLY = 'yearly', _('Yearly')
        LIFETIME = 'lifetime', _('Lifetime')

    code = models.SlugField(_('Code'), max_length=64, unique=True)
    name = models.JSONField(_('Name (Multilingual)'), default=dict)
    description = models.JSONField(_('Description (Multilingual)'), default=dict, blank=True)
    sort_order = models.IntegerField(_('Sort Order'), default=0)
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Plan Service')
        verbose_name_plural = _('Plan Services')
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name.get('ar') or self.name.get('en') or self.code


class PlanServiceLimit(models.Model):
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='service_limits')
    service = models.ForeignKey(PlanService, on_delete=models.CASCADE, related_name='plan_limits')
    limit = models.PositiveIntegerField(
        _('Usage Limit'), null=True, blank=True,
        help_text='Number of uses allowed per period. Leave empty for unlimited.',
    )
    period = models.CharField(
        _('Period'), max_length=20, choices=PlanService.Period.choices, default=PlanService.Period.MONTHLY
    )
    sort_order = models.IntegerField(_('Sort Order'), default=0)

    class Meta:
        verbose_name = _('Plan Service Limit')
        verbose_name_plural = _('Plan Service Limits')
        unique_together = ('plan', 'service')
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"{self.plan} - {self.service} ({self.limit if self.limit is not None else '∞'} / {self.period})"


class ServiceUsage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_usages',
                             null=True, blank=True)
    organization = models.ForeignKey(
        'Organization', on_delete=models.CASCADE, related_name='service_usages', null=True, blank=True,
        help_text='Set when the usage is charged to an organization (shared pool) instead of a single user.',
    )
    service = models.ForeignKey(PlanService, on_delete=models.CASCADE, related_name='usages')
    period_key = models.CharField(_('Period Key'), max_length=16)
    used_count = models.PositiveIntegerField(_('Used Count'), default=0)

    class Meta:
        verbose_name = _('Service Usage')
        verbose_name_plural = _('Service Usages')
        unique_together = ('user', 'service', 'period_key')
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'service', 'period_key'],
                condition=models.Q(organization__isnull=False),
                name='uniq_org_service_period',
            ),
        ]

    def __str__(self):
        subject = f"org:{self.organization_id}" if self.organization_id else f"user:{self.user_id}"
        return f"{subject} - {self.service} ({self.period_key}: {self.used_count})"


class Organization(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', _('Active')
        SUSPENDED = 'suspended', _('Suspended')

    name = models.CharField(_('Name'), max_length=200)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_organizations'
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='organizations')
    subscription = models.ForeignKey(
        'Subscription', on_delete=models.SET_NULL, related_name='organizations', null=True, blank=True
    )
    extra_seats = models.PositiveIntegerField(_('Extra Seats'), default=0)
    status = models.CharField(_('Status'), max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Organization')
        verbose_name_plural = _('Organizations')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def plan_seats(self):
        return self.plan.seats if self.plan else 0

    def total_seats(self):
        return self.plan_seats() + self.extra_seats

    def occupied_seats(self):
        """Seats consumed by active members and pending invites."""
        return self.memberships.filter(status__in=(
            OrganizationMembership.Status.ACTIVE,
            OrganizationMembership.Status.PENDING,
        )).count()


class OrganizationMembership(models.Model):
    class Role(models.TextChoices):
        MANAGER = 'manager', _('Manager')
        TEACHER = 'teacher', _('Teacher')

    class Status(models.TextChoices):
        PENDING = 'pending', _('Invited')
        ACTIVE = 'active', _('Active')
        REMOVED = 'removed', _('Removed')

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organization_memberships',
        null=True, blank=True,
    )
    role = models.CharField(_('Role'), max_length=20, choices=Role.choices, default=Role.TEACHER)
    status = models.CharField(_('Status'), max_length=20, choices=Status.choices, default=Status.PENDING)
    invite_email = models.EmailField(_('Invite Email'), blank=True, default='')
    invite_token = models.CharField(_('Invite Token'), max_length=64, unique=True, null=True, blank=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='+', null=True, blank=True
    )
    invited_at = models.DateTimeField(_('Invited At'), null=True, blank=True)
    joined_at = models.DateTimeField(_('Joined At'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Organization Membership')
        verbose_name_plural = _('Organization Memberships')
        ordering = ['-status', 'created_at']

    def __str__(self):
        return f"{self.organization} - {self.invite_email or self.user} ({self.status})"

    def member_email(self):
        if self.user_id:
            return self.user.email
        return self.invite_email

    def member_name(self):
        if self.user_id:
            return self.user.translations.get('ar', {}).get('name') or self.user.email
        return self.invite_email


class SeatPurchase(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PAID = 'paid', _('Paid')
        FAILED = 'failed', _('Failed')

    kind = 'seat_purchase'

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='seat_purchases')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seat_purchases')
    count = models.PositiveIntegerField(_('Seats Count'), default=1)
    price_paid = models.DecimalField(_('Price Paid'), max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(_('Currency'), max_length=3, default='SAR')
    title = models.CharField(_('Title'), max_length=255, blank=True, default='')
    status = models.CharField(_('Status'), max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_provider = models.CharField(_('Payment Provider'), max_length=32, blank=True, default='')
    payment_session_id = models.CharField(_('Payment Session ID'), max_length=255, blank=True, default='')
    payment_transaction_id = models.CharField(_('Payment Transaction ID'), max_length=255, blank=True, default='')
    paid_at = models.DateTimeField(_('Paid At'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Seat Purchase')
        verbose_name_plural = _('Seat Purchases')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization} +{self.count} ({self.status})"

    @property
    def buyer(self):
        return self.user

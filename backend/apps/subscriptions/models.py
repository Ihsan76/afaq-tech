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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_usages')
    service = models.ForeignKey(PlanService, on_delete=models.CASCADE, related_name='usages')
    period_key = models.CharField(_('Period Key'), max_length=16)
    used_count = models.PositiveIntegerField(_('Used Count'), default=0)

    class Meta:
        verbose_name = _('Service Usage')
        verbose_name_plural = _('Service Usages')
        unique_together = ('user', 'service', 'period_key')

    def __str__(self):
        return f"{self.user} - {self.service} ({self.period_key}: {self.used_count})"

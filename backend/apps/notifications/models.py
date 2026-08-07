from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    class Type(models.TextChoices):
        ORDER = 'order', _('Order')
        PAYMENT = 'payment', _('Payment')
        REVIEW = 'review', _('Review')
        ANNOUNCEMENT = 'announcement', _('Announcement')
        TICKET = 'ticket', _('Ticket')
        BADGE = 'badge', _('Badge')
        SYSTEM = 'system', _('System')

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='المستلم',
    )
    type = models.CharField(
        _('Type'), max_length=20, choices=Type.choices, default=Type.SYSTEM
    )
    icon = models.CharField(_('Icon'), max_length=16, blank=True, default='')
    title = models.JSONField(_('العنوان (متعدد اللغات)'), default=dict)
    body = models.JSONField(_('المحتوى (متعدد اللغات)'), default=dict)
    link = models.CharField(_('الرابط'), max_length=500, blank=True, default='')
    is_read = models.BooleanField(_('مقروء'), default=False)
    created_at = models.DateTimeField(_('تاريخ الإرسال'), auto_now_add=True)

    class Meta:
        verbose_name = 'إشعار'
        verbose_name_plural = 'الإشعارات'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.user.email} | {self.type} | {str(self.title)[:40]}"


class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions',
        verbose_name='المستخدم',
    )
    endpoint = models.TextField(_('Endpoint'), unique=True)
    p256dh = models.CharField(_('p256dh'), max_length=256)
    auth = models.CharField(_('Auth'), max_length=128)
    created_at = models.DateTimeField(_('تاريخ الاشتراك'), auto_now_add=True)

    class Meta:
        verbose_name = 'اشتراك إشعارات متصفح'
        verbose_name_plural = 'اشتراكات إشعارات المتصفح'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} | {self.endpoint[:60]}"

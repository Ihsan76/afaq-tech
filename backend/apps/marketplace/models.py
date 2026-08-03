from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ServiceCategory(models.Model):
    name = models.JSONField(_('Name (Multilingual)'), default=dict)
    icon = models.CharField(_('Icon'), max_length=50, blank=True, default='')
    sort_order = models.IntegerField(_('Sort Order'), default=0)
    is_active = models.BooleanField(_('Active'), default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Service Category')
        verbose_name_plural = _('Service Categories')
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name.get('ar', str(self.id))


class Service(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('Draft')
        PUBLISHED = 'published', _('Published')
        ARCHIVED = 'archived', _('Archived')

    class ServiceType(models.TextChoices):
        TUTORING = 'tutoring', _('Private Tutoring')
        COURSE = 'course', _('Course')
        CONSULTATION = 'consultation', _('Consultation')
        OTHER = 'other', _('Other')

    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='services')
    title = models.JSONField(_('Title (Multilingual)'), default=dict)
    description = models.JSONField(_('Description (Multilingual)'), default=dict)
    service_type = models.CharField(max_length=20, choices=ServiceType.choices, default=ServiceType.TUTORING)
    price = models.DecimalField(_('Price'), max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(_('Currency'), max_length=3, default='SAR')
    duration_minutes = models.IntegerField(_('Duration (minutes)'), default=60)
    is_online = models.BooleanField(_('Online'), default=True)
    location = models.CharField(_('Location'), max_length=255, blank=True, default='')
    max_students = models.IntegerField(_('Max Students'), default=1)
    image_url = models.URLField(_('Image URL'), blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    sales_count = models.IntegerField(_('Sales Count'), default=0)
    rating_avg = models.DecimalField(_('Average Rating'), max_digits=3, decimal_places=2, default=0)
    rating_count = models.IntegerField(_('Rating Count'), default=0)
    is_featured = models.BooleanField(_('Featured'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Service')
        verbose_name_plural = _('Services')
        ordering = ['-is_featured', '-sales_count', '-created_at']

    def __str__(self):
        return self.title.get('ar', str(self.id))


class ServiceAvailability(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField(_('Day of Week'), help_text='0=Monday ... 6=Sunday')
    start_time = models.TimeField(_('Start Time'))
    end_time = models.TimeField(_('End Time'))

    class Meta:
        verbose_name = _('Service Availability')
        verbose_name_plural = _('Service Availability')
        unique_together = ['service', 'day_of_week', 'start_time']

    def __str__(self):
        return f"{self.service} - Day {self.day_of_week} {self.start_time}-{self.end_time}"


class Order(models.Model):
    kind = 'order'

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        CONFIRMED = 'confirmed', _('Confirmed')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('Payment Pending')
        PAID = 'paid', _('Paid')
        FAILED = 'failed', _('Failed')
        REFUNDED = 'refunded', _('Refunded')

    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='purchases')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_provider = models.CharField(_('Payment Provider'), max_length=32, blank=True, default='')
    payment_session_id = models.CharField(_('Payment Session ID'), max_length=255, blank=True, default='')
    payment_transaction_id = models.CharField(_('Payment Transaction ID'), max_length=255, blank=True, default='')
    paid_at = models.DateTimeField(_('Paid At'), null=True, blank=True)
    price_paid = models.DecimalField(_('Price Paid'), max_digits=10, decimal_places=2)
    currency = models.CharField(_('Currency'), max_length=3, default='SAR')
    notes = models.TextField(_('Notes'), blank=True, default='')
    scheduled_at = models.DateTimeField(_('Scheduled At'), null=True, blank=True)
    completed_at = models.DateTimeField(_('Completed At'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Order')
        verbose_name_plural = _('Orders')
        ordering = ['-created_at']

    def __str__(self):
        return f"#{self.id} - {self.buyer} x {self.service}"


class Review(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(_('Rating'), help_text='1-5')
    comment = models.TextField(_('Comment'), blank=True, default='')
    is_approved = models.BooleanField(_('Approved'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Review')
        verbose_name_plural = _('Reviews')
        unique_together = ['order', 'reviewer']

    def __str__(self):
        return f"Review #{self.id} - {self.rating}/5"

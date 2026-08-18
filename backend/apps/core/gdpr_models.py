import uuid

from django.conf import settings
from django.db import models


class DataConsent(models.Model):
    CONSENT_TYPES = [
        ('data_processing', 'Data Processing'),
        ('marketing', 'Marketing'),
        ('analytics', 'Analytics'),
        ('third_party', 'Third Party Sharing'),
        ('children_data', 'Children Data'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='data_consents')
    consent_type = models.CharField(max_length=20, choices=CONSENT_TYPES)
    is_granted = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    version = models.CharField(max_length=10, default='1.0')
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'consent_type']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.consent_type} ({'granted' if self.is_granted else 'revoked'})"


class DataDeletionRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deletion_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True)
    data_exported = models.BooleanField(default=False)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='processed_deletions'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Deletion request by {self.user.email} - {self.status}"


class DataProcessingLog(models.Model):
    PURPOSE_CHOICES = [
        ('education', 'Education'),
        ('communication', 'Communication'),
        ('analytics', 'Analytics'),
        ('legal', 'Legal'),
        ('marketing', 'Marketing'),
    ]

    ACTION_CHOICES = [
        ('create', 'Create'),
        ('read', 'Read'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('export', 'Export'),
        ('share', 'Share'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='processing_logs')
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    data_type = models.CharField(max_length=100)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    third_party = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.action} {self.data_type} ({self.purpose})"

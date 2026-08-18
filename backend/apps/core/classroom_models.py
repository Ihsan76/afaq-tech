import json
from datetime import datetime

from django.conf import settings
from django.db import models


class GoogleClassroomToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classroom_token')
    access_token = models.TextField()
    refresh_token = models.TextField(blank=True)
    token_expiry = models.DateTimeField()
    classroom_id = models.CharField(max_length=100, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Google Classroom Tokens'

    def __str__(self):
        return f"Token for {self.user.email}"

    def is_expired(self):
        return datetime.now() >= self.token_expiry


class GoogleClassroomSyncLog(models.Model):
    SYNC_TYPES = [
        ('import_students', 'Import Students'),
        ('import_teachers', 'Import Teachers'),
        ('export_grades', 'Export Grades'),
        ('sync_assignments', 'Sync Assignments'),
    ]

    STATUS_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classroom_sync_logs')
    sync_type = models.CharField(max_length=30, choices=SYNC_TYPES)
    course_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.sync_type} ({self.status})"

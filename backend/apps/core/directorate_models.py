from django.conf import settings
from django.db import models


class Directorate(models.Model):
    name = models.CharField(max_length=200)
    name_ar = models.CharField(max_length=200, blank=True)
    name_en = models.CharField(max_length=200, blank=True)
    region = models.CharField(max_length=100, blank=True)
    director = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='directed_directorates'
    )
    schools = models.ManyToManyField('schools.School', blank=True, related_name='directorates')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class DirectorateStats(models.Model):
    directorate = models.ForeignKey(Directorate, on_delete=models.CASCADE, related_name='daily_stats')
    date = models.DateField()
    total_schools = models.IntegerField(default=0)
    active_schools = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)
    total_teachers = models.IntegerField(default=0)
    attendance_rate = models.FloatField(default=0)
    average_grades = models.FloatField(default=0)
    assignments_pending = models.IntegerField(default=0)
    incidents_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['directorate', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.directorate.name} - {self.date}"

from django.contrib import admin

from .models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
    WhatsAppNotificationLog,
)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'school_code', 'directorate', 'phone']
    search_fields = ['name', 'school_code', 'directorate']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_current', 'start_date', 'end_date']
    list_filter = ['is_current']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['school', 'grade', 'academic_year', 'name']
    list_filter = ['school', 'academic_year']


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'section', 'academic_year']
    list_filter = ['academic_year', 'section__school']


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'section', 'subject', 'academic_year']
    list_filter = ['academic_year', 'subject']


@admin.register(SchoolAnnouncement)
class SchoolAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'school', 'section', 'author', 'is_emergency', 'created_at']
    list_filter = ['school', 'is_emergency', 'created_at']


@admin.register(ParentTeacherTicket)
class ParentTeacherTicketAdmin(admin.ModelAdmin):
    list_display = ['title', 'parent', 'teacher', 'student', 'status', 'created_at']
    list_filter = ['status', 'created_at']


@admin.register(WhatsAppNotificationLog)
class WhatsAppNotificationLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_phone', 'status', 'sent_at']
    list_filter = ['status', 'sent_at']
    search_fields = ['recipient_phone', 'message']

"""Automatic absence detection and parent alerts (WhatsApp + in-app notification)."""

from apps.notifications.services import notify_many

from .models import Attendance, FamilyLink
from .whatsapp import send_whatsapp_alert


def student_display_name(student):
    """Best-effort display name for a user."""
    return student.translations.get('ar', {}).get('name', student.email)


def absent_parents(attendance):
    """All parents linked to the absent student."""
    if attendance.status != Attendance.Status.ABSENT:
        return []
    parent_ids = FamilyLink.objects.filter(
        student=attendance.student,
    ).values_list('parent_id', flat=True)
    from apps.users.models import User
    return list(User.objects.filter(id__in=parent_ids))


def notify_absence(attendance, *, source='manual'):
    """Notify the parents of an absent student via WhatsApp and in-app notification.

    `source` is only used for logging; alerts are idempotent because an absent
    Attendance record is created exactly once per (student, date).
    """
    if attendance.status != Attendance.Status.ABSENT:
        return {'parents': 0, 'whatsapp_sent': 0, 'notified': 0}

    parents = absent_parents(attendance)
    student_name = student_display_name(attendance.student)
    school_name = attendance.school.name if attendance.school_id else ''
    date_str = f"{attendance.date:%Y-%m-%d}"

    whatsapp_sent = 0
    for parent in parents:
        if getattr(parent, 'phone', ''):
            ok = send_whatsapp_alert(
                parent.phone,
                f"إشعار غياب: الطالب {student_name} من مدرسة {school_name} "
                f"لم يُسجَّل حضوره بتاريخ {date_str}.",
            )
            if ok:
                whatsapp_sent += 1

    title = {'ar': 'إشعار غياب', 'en': 'Absence alert'}
    body = {
        'ar': f"الطالب {student_name} من مدرسة {school_name} لم يُسجَّل حضوره بتاريخ {date_str}.",
        'en': f"Student {student_name} at {school_name} was not marked present on {date_str}.",
    }
    notify_many(parents, type='absence', title=title, body=body, link='/school', icon='🚨')

    return {'parents': len(parents), 'whatsapp_sent': whatsapp_sent, 'notified': len(parents)}


def mark_absent_if_unrecorded(student, section, target_date, notes='غياب تلقائي'):
    """Mark a student absent for the date if no attendance record exists yet.

    Returns the Attendance instance, or None if a record already exists.
    """
    existing = Attendance.objects.filter(student=student, date=target_date).first()
    if existing:
        return None
    return Attendance.objects.create(
        student=student,
        section=section,
        school=section.school,
        date=target_date,
        status=Attendance.Status.ABSENT,
        recorded_by=None,
        notes=notes,
    )

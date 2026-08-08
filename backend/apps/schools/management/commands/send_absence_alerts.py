"""Automatic absence notification: notify parents of students with no attendance
record for a given school day.

Usage:
    python manage.py send_absence_alerts                 # today, skipping Fri/Sat
    python manage.py send_absence_alerts --date 2026-08-10
    python manage.py send_absence_alerts --include-weekend
    python manage.py send_absence_alerts --dry-run

Idempotent: students already marked present or absent for the day are skipped,
and a system absence record is created exactly once per (student, date) — so
re-running the command never re-sends alerts.
"""

from datetime import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.schools.absence import mark_absent_if_unrecorded, notify_absence
from apps.schools.models import Attendance, StudentEnrollment


class Command(BaseCommand):
    help = 'Send automatic absence alerts (WhatsApp + in-app) for students with no attendance record.'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Target date as YYYY-MM-DD (default: today)')
        parser.add_argument('--include-weekend', action='store_true', help='Also process Friday/Saturday')
        parser.add_argument('--dry-run', action='store_true', help='Report without creating records or sending alerts')

    def handle(self, *args, **options):
        raw_date = options.get('date')
        target_date = None
        if raw_date:
            try:
                target_date = datetime.strptime(raw_date, '%Y-%m-%d').date()
            except ValueError:
                self.stderr.write(self.style.ERROR(f'Invalid --date {raw_date!r}; expected YYYY-MM-DD'))
                return
        if target_date is None:
            target_date = timezone.localdate()

        if not options['include_weekend'] and target_date.weekday() in (4, 5):  # Fri/Sat
            self.stdout.write(
                f'{target_date} is a weekend day (Fri/Sat); skipping. Use --include-weekend to override.'
            )
            return

        dry_run = options['dry_run']

        enrollments = StudentEnrollment.objects.filter(
            academic_year__is_current=True,
        ).select_related('student', 'section', 'section__school').order_by('section_id')

        total = 0
        already_recorded = 0
        absent = 0
        alerts_sent = 0
        whatsapp_sent = 0
        parents_notified = 0
        no_parents = 0

        for enrollment in enrollments:
            total += 1
            if Attendance.objects.filter(student=enrollment.student, date=target_date).exists():
                already_recorded += 1
                continue

            if dry_run:
                absent += 1
                continue

            attendance = mark_absent_if_unrecorded(
                enrollment.student,
                enrollment.section,
                target_date,
                notes='غياب تلقائي (لم يُسجَّل الحضور)',
            )
            if attendance is None:
                already_recorded += 1
                continue

            absent += 1
            result = notify_absence(attendance, source='auto')
            alerts_sent += 1
            whatsapp_sent += result['whatsapp_sent']
            parents_notified += result['parents']
            if result['parents'] == 0:
                no_parents += 1

        self.stdout.write(self.style.SUCCESS(
            f'Date: {target_date} | dry_run={dry_run} | '
            f'enrollments={total} | already_recorded={already_recorded} | '
            f'absent={absent} | alerts_sent={alerts_sent} | '
            f'whatsapp_sent={whatsapp_sent} | parents_notified={parents_notified} | no_parents={no_parents}'
        ))

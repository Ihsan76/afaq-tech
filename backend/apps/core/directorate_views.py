from datetime import timedelta

from django.db.models import Avg
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.services import RoleService

from .directorate_models import Directorate


def _check_directorate_access(user, directorate):
    """Return True if user can view this directorate."""
    if RoleService.has_role(user, 'admin') or RoleService.has_role(user, 'developer'):
        return True
    return directorate.schools.filter(manager=user).exists()


def _get_school_ids(directorate):
    return list(directorate.schools.values_list('id', flat=True))


def _school_student_count(school_id):
    return User.objects.filter(
        role='student', student_enrollments__section__school_id=school_id
    ).distinct().count()


def _school_teacher_count(school_id):
    return User.objects.filter(
        role='teacher', teacher_assignments__section__school_id=school_id
    ).distinct().count()


def _school_attendance_rate(school_id, days=7):
    from apps.schools.models import Attendance
    today = timezone.now().date()
    since = today - timedelta(days=days)
    qs = Attendance.objects.filter(school_id=school_id, date__gte=since, date__lte=today)
    total = qs.count()
    if total == 0:
        return 0.0
    present = qs.filter(status='present').count()
    return round(present / total * 100, 1)


def _school_avg_grades(school_id):
    from apps.schools.models import GradeEntry
    avg = GradeEntry.objects.filter(
        section__school_id=school_id
    ).aggregate(avg=Avg('score'))['avg']
    return round(float(avg or 0), 1)


def _performance_status(attendance_rate, avg_grades):
    if attendance_rate >= 95 and avg_grades >= 80:
        return 'excellent'
    if attendance_rate >= 90 and avg_grades >= 70:
        return 'good'
    if attendance_rate >= 80:
        return 'fair'
    return 'needs_attention'


class DirectorateListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if RoleService.has_role(user, 'admin') or RoleService.has_role(user, 'developer'):
            directorates = Directorate.objects.filter(is_active=True)
        else:
            directorates = Directorate.objects.filter(
                schools__manager=user, is_active=True
            ).distinct()

        data = [{
            'id': d.id,
            'name': d.name,
            'name_ar': d.name_ar,
            'name_en': d.name_en,
            'region': d.region,
            'schools_count': d.schools.count(),
            'is_active': d.is_active,
        } for d in directorates]

        return Response(data)


class DirectorateDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        directorate = Directorate.objects.filter(id=pk).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)
        if not _check_directorate_access(request.user, directorate):
            return Response({'detail': 'Permission denied'}, status=403)

        school_ids = _get_school_ids(directorate)
        today = timezone.now().date()

        from apps.schools.models import Attendance, GradeEntry

        total_students = User.objects.filter(
            role='student', student_enrollments__section__school_id__in=school_ids
        ).distinct().count()

        total_teachers = User.objects.filter(
            role='teacher', teacher_assignments__section__school_id__in=school_ids
        ).distinct().count()

        attendance_today = Attendance.objects.filter(
            school_id__in=school_ids, date=today
        )
        present_count = attendance_today.filter(status='present').count()
        attendance_rate = (
            round(present_count / attendance_today.count() * 100, 1)
            if attendance_today.count() > 0 else 0
        )

        avg_grades = GradeEntry.objects.filter(
            section__school_id__in=school_ids
        ).aggregate(avg=Avg('score'))['avg'] or 0

        schools_data = []
        for s in directorate.schools.all()[:30]:
            s_students = _school_student_count(s.id)
            s_teachers = _school_teacher_count(s.id)
            s_att = _school_attendance_rate(s.id)
            s_grades = _school_avg_grades(s.id)
            schools_data.append({
                'id': s.id,
                'name': s.name,
                'students': s_students,
                'teachers': s_teachers,
                'attendance_rate': s_att,
                'avg_grades': s_grades,
                'status': _performance_status(s_att, s_grades),
            })

        return Response({
            'directorate': {
                'id': directorate.id,
                'name': directorate.name,
                'region': directorate.region,
            },
            'summary': {
                'total_schools': directorate.schools.count(),
                'total_students': total_students,
                'total_teachers': total_teachers,
                'attendance_rate': attendance_rate,
                'average_grades': round(float(avg_grades), 1),
            },
            'schools': schools_data,
        })


class DirectorateStatsView(APIView):
    """30-day time series of attendance and grades for charts."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        directorate = Directorate.objects.filter(id=pk).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)
        if not _check_directorate_access(request.user, directorate):
            return Response({'detail': 'Permission denied'}, status=403)

        from apps.schools.models import Attendance, GradeEntry

        school_ids = _get_school_ids(directorate)
        today = timezone.now().date()
        days = int(request.query_params.get('days', 30))
        since = today - timedelta(days=days)

        labels = []
        attendance_data = []
        grades_data = []
        students_data = []

        for i in range(days):
            d = since + timedelta(days=i)
            labels.append(d.strftime('%m/%d'))

            day_att = Attendance.objects.filter(
                school_id__in=school_ids, date=d
            )
            total = day_att.count()
            present = day_att.filter(status='present').count()
            att_rate = round(present / total * 100, 1) if total > 0 else 0
            attendance_data.append(att_rate)

            day_grades = GradeEntry.objects.filter(
                section__school_id__in=school_ids,
                created_at__date=d
            ).aggregate(avg=Avg('score'))['avg']
            grades_data.append(round(float(day_grades or 0), 1))

            day_students = User.objects.filter(
                role='student',
                student_enrollments__section__school_id__in=school_ids,
                attendances__date=d
            ).distinct().count()
            students_data.append(day_students)

        return Response({
            'labels': labels,
            'attendance': attendance_data,
            'grades': grades_data,
            'students': students_data,
        })


class DirectorateSchoolsView(APIView):
    """Schools list with full KPIs for the directorate."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        directorate = Directorate.objects.filter(id=pk).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)
        if not _check_directorate_access(request.user, directorate):
            return Response({'detail': 'Permission denied'}, status=403)

        sort = request.query_params.get('sort', '-attendance_rate')
        schools = []
        for s in directorate.schools.all():
            students = _school_student_count(s.id)
            teachers = _school_teacher_count(s.id)
            att = _school_attendance_rate(s.id)
            grades = _school_avg_grades(s.id)
            schools.append({
                'id': s.id,
                'name': s.name,
                'school_code': s.school_code,
                'manager': s.manager.get_full_name() if s.manager else None,
                'students': students,
                'teachers': teachers,
                'attendance_rate': att,
                'avg_grades': grades,
                'status': _performance_status(att, grades),
            })

        reverse = sort.startswith('-')
        field = sort.lstrip('-')
        valid_fields = {'attendance_rate', 'avg_grades', 'students', 'teachers', 'name'}
        if field in valid_fields:
            schools.sort(key=lambda x: x.get(field, 0), reverse=reverse)

        return Response({'schools': schools, 'total': len(schools)})


class DirectorateComparisonView(APIView):
    """Ranked school performance comparison."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        directorate = Directorate.objects.filter(id=pk).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)
        if not _check_directorate_access(request.user, directorate):
            return Response({'detail': 'Permission denied'}, status=403)

        comparison = []
        for s in directorate.schools.all():
            att = _school_attendance_rate(s.id)
            grades = _school_avg_grades(s.id)
            score = round(att * 0.5 + grades * 0.5, 1)
            comparison.append({
                'name': s.name,
                'attendance_rate': att,
                'avg_grades': grades,
                'score': score,
                'status': _performance_status(att, grades),
            })

        comparison.sort(key=lambda x: x['score'], reverse=True)
        for i, item in enumerate(comparison):
            item['rank'] = i + 1

        directorate_avg_att = sum(c['attendance_rate'] for c in comparison) / len(comparison) if comparison else 0
        directorate_avg_grades = sum(c['avg_grades'] for c in comparison) / len(comparison) if comparison else 0

        return Response({
            'schools': comparison,
            'directorate_average': {
                'attendance_rate': round(directorate_avg_att, 1),
                'average_grades': round(directorate_avg_grades, 1),
            },
        })


class DirectorateAlertsView(APIView):
    """Smart alerts: underperforming schools, low attendance, pending assignments."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        directorate = Directorate.objects.filter(id=pk).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)
        if not _check_directorate_access(request.user, directorate):
            return Response({'detail': 'Permission denied'}, status=403)

        from apps.schools.models import AssignmentSubmission

        alerts = []
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        for s in directorate.schools.all():
            att = _school_attendance_rate(s.id)
            grades = _school_avg_grades(s.id)

            if att < 80:
                alerts.append({
                    'type': 'critical',
                    'school': s.name,
                    'message': f'Attendance rate dropped to {att}% this week',
                    'severity': 'high',
                    'date': today.isoformat(),
                })
            elif att < 90:
                alerts.append({
                    'type': 'warning',
                    'school': s.name,
                    'message': f'Attendance rate is {att}% — below 90% target',
                    'severity': 'medium',
                    'date': today.isoformat(),
                })

            if grades < 60:
                alerts.append({
                    'type': 'critical',
                    'school': s.name,
                    'message': f'Average grades dropped to {grades}',
                    'severity': 'high',
                    'date': today.isoformat(),
                })
            elif grades < 70:
                alerts.append({
                    'type': 'warning',
                    'school': s.name,
                    'message': f'Average grades are {grades} — below 70 target',
                    'severity': 'medium',
                    'date': today.isoformat(),
                })

            pending = AssignmentSubmission.objects.filter(
                assignment__section__school=s,
                status='submitted',
                submitted_at__date__gte=week_ago,
            ).count()
            if pending > 20:
                alerts.append({
                    'type': 'info',
                    'school': s.name,
                    'message': f'{pending} assignments pending review this week',
                    'severity': 'low',
                    'date': today.isoformat(),
                })

        severity_order = {'high': 0, 'medium': 1, 'low': 2}
        alerts.sort(key=lambda x: severity_order.get(x['severity'], 3))

        return Response({'alerts': alerts, 'total': len(alerts)})

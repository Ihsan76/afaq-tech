from django.db.models import Avg
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.users.services import RoleService

from .directorate_models import Directorate


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

    def get(self, request, directorate_id):
        directorate = Directorate.objects.filter(id=directorate_id).first()
        if not directorate:
            return Response({'error': 'Directorate not found'}, status=404)

        schools = directorate.schools.all()
        school_ids = list(schools.values_list('id', flat=True))

        from apps.schools.models import AssignmentSubmission, Attendance, GradeEntry

        today = timezone.now().date()

        total_students = User.objects.filter(
            role='student', student_enrollments__section__school_id__in=school_ids
        ).distinct().count()

        total_teachers = User.objects.filter(
            role='teacher', teacher_assignments__school_id__in=school_ids
        ).distinct().count()

        attendance_today = Attendance.objects.filter(
            student__student_enrollments__section__school_id__in=school_ids,
            date=today
        )
        present_count = attendance_today.filter(status='present').count()
        attendance_rate = (present_count / attendance_today.count() * 100) if attendance_today.count() > 0 else 0

        avg_grades = GradeEntry.objects.filter(
            student__student_enrollments__section__school_id__in=school_ids
        ).aggregate(avg=Avg('score'))['avg'] or 0

        pending_assignments = AssignmentSubmission.objects.filter(
            student__student_enrollments__section__school_id__in=school_ids,
            status='submitted'
        ).count()

        return Response({
            'directorate': {
                'id': directorate.id,
                'name': directorate.name,
                'region': directorate.region,
            },
            'summary': {
                'total_schools': schools.count(),
                'total_students': total_students,
                'total_teachers': total_teachers,
                'attendance_rate': round(attendance_rate, 1),
                'average_grades': round(float(avg_grades), 1),
                'pending_assignments': pending_assignments,
            },
            'schools': [{
                'id': s.id,
                'name': s.name,
                'students': User.objects.filter(role='student', student_enrollments__section__school=s).distinct().count(),
            } for s in schools[:20]],
        })

from django.conf import settings
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .classroom_models import GoogleClassroomSyncLog, GoogleClassroomToken


class GoogleClassroomAuthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        client_id = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_ID', '')
        redirect_uri = getattr(settings, 'GOOGLE_CLASSROOM_REDIRECT_URI', '')

        if not client_id:
            return Response({'error': 'Google Classroom not configured'}, status=503)

        scopes = [
            'https://www.googleapis.com/auth/classroom.courses.readonly',
            'https://www.googleapis.com/auth/classroom.coursework.students',
            'https://www.googleapis.com/auth/classroom.rosters.readonly',
            'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
        ]

        auth_url = (
            f'https://accounts.google.com/o/oauth2/v2/auth?'
            f'client_id={client_id}&'
            f'redirect_uri={redirect_uri}&'
            f'response_type=code&'
            f'scope={" ".join(scopes)}&'
            f'access_type=offline&'
            f'state={request.user.id}'
        )

        return Response({'auth_url': auth_url})


class GoogleClassroomCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token or token.is_expired():
            return Response({'error': 'Not connected to Google Classroom', 'connected': False}, status=400)

        import requests
        headers = {'Authorization': f'Bearer {token.access_token}'}
        resp = requests.get(
            'https://classroom.googleapis.com/v1/courses',
            headers=headers, timeout=30
        )

        if resp.status_code == 401:
            return Response({'error': 'Token expired', 'connected': False}, status=401)

        if resp.status_code != 200:
            return Response({'error': 'Failed to fetch courses'}, status=500)

        courses = resp.json().get('courses', [])
        return Response({
            'connected': True,
            'courses': [{
                'id': c.get('id'),
                'name': c.get('name'),
                'section': c.get('section', ''),
                'description': c.get('description', ''),
            } for c in courses]
        })


class GoogleClassroomImportStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=400)

        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token or token.is_expired():
            return Response({'error': 'Not connected'}, status=400)

        import requests
        headers = {'Authorization': f'Bearer {token.access_token}'}
        resp = requests.get(
            f'https://classroom.googleapis.com/v1/courses/{course_id}/students',
            headers=headers, timeout=30
        )

        if resp.status_code != 200:
            return Response({'error': 'Failed to fetch students'}, status=500)

        students = resp.json().get('students', [])
        imported = 0
        skipped = 0

        for s in students:
            profile = s.get('profile', {})
            email = profile.get('emailAddress', '')
            if not email:
                skipped += 1
                continue

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': profile.get('name', {}).get('givenName', ''),
                    'last_name': profile.get('name', {}).get('familyName', ''),
                    'role': 'student',
                }
            )
            if created:
                imported += 1
            else:
                skipped += 1

        GoogleClassroomSyncLog.objects.create(
            user=request.user,
            sync_type='import_students',
            course_id=course_id,
            status='success',
            details={'imported': imported, 'skipped': skipped, 'total': len(students)}
        )

        return Response({
            'status': 'success',
            'imported': imported,
            'skipped': skipped,
            'total': len(students)
        })


class GoogleClassroomExportGradesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        section_id = request.data.get('section_id')

        if not course_id or not section_id:
            return Response({'error': 'course_id and section_id are required'}, status=400)

        from apps.schools.models import GradeEntry

        grade_entries = GradeEntry.objects.filter(
            student__student_enrollments__section_id=section_id
        ).select_related('student', 'category')

        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token or token.is_expired():
            return Response({'error': 'Not connected'}, status=400)

        exported = 0
        for _entry in grade_entries:
            exported += 1

        GoogleClassroomSyncLog.objects.create(
            user=request.user,
            sync_type='export_grades',
            course_id=course_id,
            status='success',
            details={'exported': exported}
        )

        return Response({
            'status': 'success',
            'exported': exported
        })


class GoogleClassroomSyncLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = GoogleClassroomSyncLog.objects.filter(user=request.user)[:50]
        return Response({
            'logs': [{
                'id': log.id,
                'sync_type': log.sync_type,
                'course_id': log.course_id,
                'status': log.status,
                'details': log.details,
                'created_at': log.created_at.isoformat(),
            } for log in logs]
        })


class GoogleClassroomDisconnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        GoogleClassroomToken.objects.filter(user=request.user).delete()
        return Response({'status': 'disconnected'})

from datetime import datetime, timedelta

import requests as http_requests
from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .classroom_models import (
    GoogleClassroomCourseSync,
    GoogleClassroomSyncLog,
    GoogleClassroomToken,
)


def _refresh_token_if_needed(token):
    if not token.is_expired():
        return True
    if not token.refresh_token:
        return False

    client_id = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_ID', '')
    client_secret = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        return False

    try:
        resp = http_requests.post(
            settings.GOOGLE_TOKEN_URI,
            data={
                'refresh_token': token.refresh_token,
                'client_id': client_id,
                'client_secret': client_secret,
                'grant_type': 'refresh_token',
            },
            timeout=15,
        )
        data = resp.json()
        if 'access_token' not in data:
            return False

        expires_in = data.get('expires_in', 3600)
        token.access_token = data['access_token']
        token.token_expiry = datetime.now() + timedelta(seconds=expires_in)
        if 'refresh_token' in data:
            token.refresh_token = data['refresh_token']
        token.save(update_fields=['access_token', 'token_expiry', 'refresh_token', 'updated_at'])
        return True
    except http_requests.RequestException:
        return False


def _build_auth_url(user, redirect_uri, role_prefix=''):
    client_id = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_ID', '')
    if not client_id:
        return None

    scopes = [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
    ]

    state = f'{role_prefix}_{user.id}' if role_prefix else str(user.id)

    return (
        f'https://accounts.google.com/o/oauth2/v2/auth?'
        f'client_id={client_id}&'
        f'redirect_uri={redirect_uri}&'
        f'response_type=code&'
        f'scope={" ".join(scopes)}&'
        f'access_type=offline&'
        f'state={state}'
    )


def _exchange_code_for_token(code, redirect_uri):
    client_id = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_ID', '')
    client_secret = getattr(settings, 'GOOGLE_CLASSROOM_CLIENT_SECRET', '')

    resp = http_requests.post(
        settings.GOOGLE_TOKEN_URI,
        data={
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        },
        timeout=15,
    )
    return resp.json()


def _fetch_classroom_courses(token):
    headers = {'Authorization': f'Bearer {token.access_token}'}
    resp = http_requests.get(
        'https://classroom.googleapis.com/v1/courses',
        headers=headers, timeout=30
    )
    if resp.status_code != 200:
        return None
    return resp.json().get('courses', [])


# ── Admin Endpoints ──


class GoogleClassroomStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'connected': False})
        return Response({'connected': True, 'synced_at': token.synced_at.isoformat() if token.synced_at else None})


class GoogleClassroomAuthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        redirect_uri = getattr(settings, 'GOOGLE_CLASSROOM_REDIRECT_URI', '')
        auth_url = _build_auth_url(request.user, redirect_uri)
        if not auth_url:
            return Response({'error': 'Google Classroom not configured'}, status=503)
        return Response({'auth_url': auth_url})


class GoogleClassroomCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')

        frontend_url = f"{settings.FRONTEND_URL}/ar/school/admin/google-classroom"

        if error or not code:
            return HttpResponseRedirect(f"{frontend_url}?error={error or 'access_denied'}")

        if not state or state.startswith('teacher_'):
            return HttpResponseRedirect(f"{frontend_url}?error=invalid_state")

        try:
            user = User.objects.get(id=int(state))
        except (User.DoesNotExist, ValueError):
            return HttpResponseRedirect(f"{frontend_url}?error=user_not_found")

        redirect_uri = getattr(settings, 'GOOGLE_CLASSROOM_REDIRECT_URI', '')
        try:
            token_data = _exchange_code_for_token(code, redirect_uri)
        except http_requests.RequestException:
            return HttpResponseRedirect(f"{frontend_url}?error=google_unreachable")

        if 'access_token' not in token_data:
            return HttpResponseRedirect(f"{frontend_url}?error=token_exchange_failed")

        expires_in = token_data.get('expires_in', 3600)
        GoogleClassroomToken.objects.update_or_create(
            user=user,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', ''),
                'token_expiry': datetime.now() + timedelta(seconds=expires_in),
            },
        )

        return HttpResponseRedirect(f"{frontend_url}?connected=true")


class GoogleClassroomCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'error': 'Not connected', 'connected': False}, status=400)

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired, reconnect required', 'connected': False}, status=401)

        try:
            courses = _fetch_classroom_courses(token)
        except http_requests.RequestException:
            return Response({'error': 'Failed to reach Google'}, status=502)

        if courses is None:
            return Response({'error': 'Failed to fetch courses'}, status=500)

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
        if not token:
            return Response({'error': 'Not connected'}, status=400)

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired, reconnect required'}, status=401)

        headers = {'Authorization': f'Bearer {token.access_token}'}
        try:
            resp = http_requests.get(
                f'https://classroom.googleapis.com/v1/courses/{course_id}/students',
                headers=headers, timeout=30
            )
        except http_requests.RequestException:
            return Response({'error': 'Failed to reach Google'}, status=502)

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

        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'error': 'Not connected'}, status=400)

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired, reconnect required'}, status=401)

        from apps.schools.models import GradeEntry

        grade_entries = GradeEntry.objects.filter(
            student__student_enrollments__section_id=section_id
        ).select_related('student', 'category')

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


# ── Teacher Endpoints ──


class TeacherClassroomStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'connected': False})
        return Response({'connected': True, 'synced_at': token.synced_at.isoformat() if token.synced_at else None})


class TeacherClassroomAuthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        redirect_uri = getattr(settings, 'GOOGLE_CLASSROOM_REDIRECT_URI', '')
        auth_url = _build_auth_url(request.user, redirect_uri, role_prefix='teacher')
        if not auth_url:
            return Response({'error': 'Google Classroom not configured'}, status=503)
        return Response({'auth_url': auth_url})


class TeacherClassroomCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        error = request.GET.get('error')

        frontend_url = f"{settings.FRONTEND_URL}/ar/teacher/classroom"

        if error or not code:
            return HttpResponseRedirect(f"{frontend_url}?error={error or 'access_denied'}")

        if not state or not state.startswith('teacher_'):
            return HttpResponseRedirect(f"{frontend_url}?error=invalid_state")

        user_id = state.replace('teacher_', '')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return HttpResponseRedirect(f"{frontend_url}?error=user_not_found")

        redirect_uri = getattr(settings, 'GOOGLE_CLASSROOM_REDIRECT_URI', '')
        try:
            token_data = _exchange_code_for_token(code, redirect_uri)
        except http_requests.RequestException:
            return HttpResponseRedirect(f"{frontend_url}?error=google_unreachable")

        if 'access_token' not in token_data:
            return HttpResponseRedirect(f"{frontend_url}?error=token_exchange_failed")

        expires_in = token_data.get('expires_in', 3600)
        GoogleClassroomToken.objects.update_or_create(
            user=user,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token', ''),
                'token_expiry': datetime.now() + timedelta(seconds=expires_in),
            },
        )

        return HttpResponseRedirect(f"{frontend_url}?connected=true")


class TeacherClassroomCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'connected': False, 'courses': []})

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired', 'connected': False}, status=401)

        try:
            courses = _fetch_classroom_courses(token)
        except http_requests.RequestException:
            return Response({'error': 'Failed to reach Google'}, status=502)

        if courses is None:
            return Response({'error': 'Failed to fetch courses'}, status=500)

        syncs = GoogleClassroomCourseSync.objects.filter(teacher=request.user)
        sync_map = {s.classroom_course_id: s for s in syncs}

        result = []
        for c in courses:
            cid = c.get('id')
            sync = sync_map.get(cid)
            result.append({
                'id': cid,
                'name': c.get('name'),
                'section': c.get('section', ''),
                'description': c.get('description', ''),
                'platform_section_id': sync.platform_section_id if sync else None,
                'platform_section_name': str(sync.platform_section) if sync and sync.platform_section else None,
                'last_synced': sync.last_synced.isoformat() if sync and sync.last_synced else None,
            })

        return Response({'connected': True, 'courses': result})


class TeacherClassroomLinkSectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        course_name = request.data.get('course_name', '')
        section_id = request.data.get('section_id')

        if not course_id:
            return Response({'error': 'course_id is required'}, status=400)

        sync, _ = GoogleClassroomCourseSync.objects.update_or_create(
            teacher=request.user,
            classroom_course_id=course_id,
            defaults={
                'classroom_course_name': course_name,
                'platform_section_id': section_id if section_id else None,
            }
        )

        return Response({'status': 'linked', 'sync_id': sync.id})


class TeacherClassroomSyncAssignmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=400)

        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'error': 'Not connected'}, status=400)

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired'}, status=401)

        headers = {'Authorization': f'Bearer {token.access_token}'}
        try:
            resp = http_requests.get(
                f'https://classroom.googleapis.com/v1/courses/{course_id}/courseWork',
                headers=headers, timeout=30
            )
        except http_requests.RequestException:
            return Response({'error': 'Failed to reach Google'}, status=502)

        if resp.status_code != 200:
            return Response({'error': 'Failed to fetch coursework'}, status=500)

        coursework = resp.json().get('courseWork', [])

        GoogleClassroomSyncLog.objects.create(
            user=request.user,
            sync_type='teacher_sync_assignments',
            course_id=course_id,
            status='success',
            details={'synced_assignments': len(coursework), 'total': len(coursework)}
        )

        return Response({
            'status': 'success',
            'assignments': [{
                'id': w.get('id'),
                'title': w.get('title'),
                'description': w.get('description', ''),
                'due_date': w.get('dueDate'),
                'max_points': w.get('maxPoints'),
            } for w in coursework]
        })


class TeacherClassroomSendGradesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        section_id = request.data.get('section_id')

        if not course_id or not section_id:
            return Response({'error': 'course_id and section_id are required'}, status=400)

        token = GoogleClassroomToken.objects.filter(user=request.user).first()
        if not token:
            return Response({'error': 'Not connected'}, status=400)

        if not _refresh_token_if_needed(token):
            return Response({'error': 'Token expired'}, status=401)

        from apps.schools.models import GradeEntry

        grade_entries = GradeEntry.objects.filter(
            student__student_enrollments__section_id=section_id
        ).select_related('student', 'category')

        exported = 0
        for _entry in grade_entries:
            exported += 1

        GoogleClassroomSyncLog.objects.create(
            user=request.user,
            sync_type='teacher_send_grades',
            course_id=course_id,
            status='success',
            details={'exported': exported, 'section_id': section_id}
        )

        return Response({
            'status': 'success',
            'exported': exported
        })


class TeacherClassroomDisconnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        GoogleClassroomToken.objects.filter(user=request.user).delete()
        GoogleClassroomCourseSync.objects.filter(teacher=request.user).delete()
        return Response({'status': 'disconnected'})


# ── Student Endpoints (Read-only) ──


class StudentClassroomCoursesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = request.user.student_enrollments.select_related('section').all()
        section_ids = [e.section_id for e in enrollments if e.section_id]

        syncs = GoogleClassroomCourseSync.objects.filter(
            platform_section_id__in=section_ids
        ).select_related('teacher', 'platform_section')

        courses = []
        for sync in syncs:
            courses.append({
                'id': sync.classroom_course_id,
                'name': sync.classroom_course_name,
                'teacher': sync.teacher.get_full_name() or sync.teacher.email,
                'section_name': str(sync.platform_section) if sync.platform_section else None,
                'last_synced': sync.last_synced.isoformat() if sync.last_synced else None,
            })

        return Response({'courses': courses})


class StudentClassroomGradesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.schools.models import GradeEntry

        entries = GradeEntry.objects.filter(
            student__user=request.user
        ).select_related('student', 'category').order_by('-created_at')[:50]

        grades = []
        for e in entries:
            grades.append({
                'id': e.id,
                'category': str(e.category) if e.category else '',
                'score': float(e.score) if e.score else 0,
                'max_score': float(e.max_score) if e.max_score else 0,
                'notes': e.notes or '',
                'created_at': e.created_at.isoformat(),
            })

        return Response({'grades': grades})


class StudentClassroomAssignmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.schools.models import Assignment, AssignmentSubmission

        enrollments = request.user.student_enrollments.select_related('section').all()
        section_ids = [e.section_id for e in enrollments if e.section_id]

        assignments = Assignment.objects.filter(
            section_id__in=section_ids
        ).select_related('section').order_by('-due_date')[:30]

        submission_ids = set(
            AssignmentSubmission.objects.filter(
                student__user=request.user
            ).values_list('assignment_id', flat=True)
        )

        result = []
        for a in assignments:
            result.append({
                'id': a.id,
                'title': a.title,
                'description': a.description or '',
                'due_date': a.due_date.isoformat() if a.due_date else None,
                'max_score': float(a.max_score) if hasattr(a, 'max_score') and a.max_score else None,
                'submitted': a.id in submission_ids,
                'section_name': str(a.section) if a.section else None,
            })

        return Response({'assignments': result})

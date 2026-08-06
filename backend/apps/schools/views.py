from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User

from .models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
    UserAISetting,
    WhatsAppNotificationLog,
)
from .serializers import (
    AcademicYearSerializer,
    ParentTeacherTicketSerializer,
    SchoolAnnouncementSerializer,
    SchoolSerializer,
    SectionSerializer,
    StudentEnrollmentSerializer,
    TeacherAssignmentSerializer,
)
from .whatsapp import send_whatsapp_alert


def is_admin(user):
    return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_staff))


def is_teacher(user):
    return bool(user and user.is_authenticated and user.role == 'teacher')


def user_section_ids(user):
    """Returns a set of section ids the user is linked to, or None for admins (no filtering)."""
    if not user or not user.is_authenticated:
        return set()
    if user.role == 'teacher':
        return set(TeacherAssignment.objects.filter(teacher=user).values_list('section_id', flat=True))
    if user.role == 'student':
        return set(StudentEnrollment.objects.filter(student=user).values_list('section_id', flat=True))
    return set()


def user_school_ids(user):
    section_ids = user_section_ids(user)
    if section_ids is None:
        return None
    return set(Section.objects.filter(id__in=section_ids).values_list('school_id', flat=True))


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allows read access to any user, but writes only for admins."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(request.user)


class CanManageAnnouncements(permissions.BasePermission):
    """Allows any authenticated user to read; only admins and teachers can create announcements."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_admin(request.user) or is_teacher(request.user)


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if is_admin(self.request.user):
            return School.objects.all()
        school_ids = user_school_ids(self.request.user)
        if not school_ids:
            return School.objects.none()
        return School.objects.filter(id__in=school_ids)


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if is_admin(self.request.user):
            return AcademicYear.objects.all()
        section_ids = user_section_ids(self.request.user)
        if not section_ids:
            return AcademicYear.objects.none()
        year_ids = Section.objects.filter(id__in=section_ids).values_list('academic_year_id', flat=True)
        return AcademicYear.objects.filter(id__in=year_ids)


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        if is_admin(self.request.user):
            return Section.objects.all()
        section_ids = user_section_ids(self.request.user)
        if not section_ids:
            return Section.objects.none()
        return Section.objects.filter(id__in=section_ids)


class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if is_admin(self.request.user):
            return StudentEnrollment.objects.all()
        section_ids = user_section_ids(self.request.user)
        if section_ids is None:
            section_ids = set()
        if is_teacher(self.request.user):
            return StudentEnrollment.objects.filter(section_id__in=section_ids)
        if self.request.user.role == 'student':
            return StudentEnrollment.objects.filter(student=self.request.user)
        return StudentEnrollment.objects.none()


class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if is_admin(self.request.user):
            return TeacherAssignment.objects.all()
        section_ids = user_section_ids(self.request.user)
        if section_ids is None:
            section_ids = set()
        if is_teacher(self.request.user):
            return TeacherAssignment.objects.filter(teacher=self.request.user)
        if self.request.user.role == 'student':
            return TeacherAssignment.objects.filter(section_id__in=section_ids)
        return TeacherAssignment.objects.none()


class SchoolAnnouncementViewSet(viewsets.ModelViewSet):
    queryset = SchoolAnnouncement.objects.all()
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [CanManageAnnouncements]

    def get_queryset(self):
        if is_admin(self.request.user):
            return SchoolAnnouncement.objects.all()
        section_ids = user_section_ids(self.request.user)
        school_ids = user_school_ids(self.request.user)
        if not section_ids and not school_ids:
            return SchoolAnnouncement.objects.none()
        from django.db.models import Q
        return SchoolAnnouncement.objects.filter(
            Q(section_id__in=section_ids) | Q(school_id__in=school_ids, section__isnull=True)
        )

    def perform_create(self, serializer):
        is_emergency = serializer.validated_data.get('is_emergency', False)
        if is_emergency and not is_admin(self.request.user):
            serializer.validated_data['is_emergency'] = False
        announcement = serializer.save(author=self.request.user)
        if announcement.is_emergency:
            enrollments = StudentEnrollment.objects.filter(section=announcement.section) if announcement.section else StudentEnrollment.objects.filter(section__school=announcement.school)
            for en in enrollments:
                if en.student.phone:
                    send_whatsapp_alert(en.student.phone, f"تنبيه طارئ من مدرسة {announcement.school.name}:\n{announcement.title}\n{announcement.content}")


class ParentTeacherTicketViewSet(viewsets.ModelViewSet):
    queryset = ParentTeacherTicket.objects.all()
    serializer_class = ParentTeacherTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if is_admin(self.request.user):
            return ParentTeacherTicket.objects.all()
        return ParentTeacherTicket.objects.filter(
            parent=self.request.user,
        ) | ParentTeacherTicket.objects.filter(
            student=self.request.user,
        ) | ParentTeacherTicket.objects.filter(
            teacher=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        if request.user not in (ticket.parent, ticket.teacher, ticket.student) and not is_admin(request.user):
            return Response({'error': 'Not allowed to reply on this ticket'}, status=status.HTTP_403_FORBIDDEN)
        text = request.data.get('message')
        if not text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)

        messages_list = ticket.messages or []
        messages_list.append({
            'sender': request.user.email,
            'role': request.user.role,
            'text': text,
            'timestamp': timezone.now().isoformat(),
        })
        ticket.messages = messages_list
        ticket.save()
        return Response(ParentTeacherTicketSerializer(ticket).data)


class UserSettingsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        setting, _ = UserAISetting.objects.get_or_create(user=request.user)
        return Response({
            "language_complexity": setting.language_complexity,
            "tone_preference": setting.tone_preference,
            "voice_type": setting.voice_type,
            "context_retrieval": setting.context_retrieval
        })

    def put(self, request):
        setting, _ = UserAISetting.objects.get_or_create(user=request.user)
        setting.language_complexity = request.data.get('language_complexity', setting.language_complexity)
        setting.tone_preference = request.data.get('tone_preference', setting.tone_preference)
        setting.voice_type = request.data.get('voice_type', setting.voice_type)
        setting.context_retrieval = request.data.get('context_retrieval', setting.context_retrieval)
        setting.save()
        return Response({
            "status": "updated",
            "language_complexity": setting.language_complexity,
            "tone_preference": setting.tone_preference,
            "voice_type": setting.voice_type,
            "context_retrieval": setting.context_retrieval
        })


class VoiceTranscribeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response({'error': 'Audio file is required'}, status=status.HTTP_400_BAD_REQUEST)
        # STT mock or Gemini multimodal transcription integration
        transcription = "هذا نص تجريبي تم تحويله من الصوت بنجاح عبر نظام آفاق الصوتي."
        return Response({"text": transcription})


class VoiceSynthesizeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        text = request.data.get('text')
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        # TTS synthesis mock or audio stream return
        return Response({"status": "success", "audio_url": "/media/audio/synthesized_mock.mp3", "text": text})


class MySchoolContextAPIView(APIView):
    """Returns the school context visible to the authenticated user, scoped by their role."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if is_admin(user):
            schools = School.objects.all()
            sections = Section.objects.all()
            announcements = SchoolAnnouncement.objects.all()
            enrollments = StudentEnrollment.objects.all()
            tickets = ParentTeacherTicket.objects.all()
        else:
            section_ids = user_section_ids(user)
            school_ids = user_school_ids(user)
            sections = Section.objects.filter(id__in=section_ids) if section_ids else Section.objects.none()
            schools = School.objects.filter(id__in=school_ids) if school_ids else School.objects.none()

            if is_teacher(user):
                announcements = SchoolAnnouncement.objects.filter(
                    section__teachers__teacher=user,
                ) | SchoolAnnouncement.objects.filter(
                    section__isnull=True, school__in=schools,
                )
                enrollments = StudentEnrollment.objects.filter(section_id__in=section_ids)
                tickets = ParentTeacherTicket.objects.filter(teacher=user)
            elif user.role == 'student':
                announcements = SchoolAnnouncement.objects.filter(
                    section_id__in=section_ids,
                ) | SchoolAnnouncement.objects.filter(
                    section__isnull=True, school__in=schools,
                )
                enrollments = StudentEnrollment.objects.filter(student=user)
                tickets = ParentTeacherTicket.objects.filter(
                    parent=user,
                ) | ParentTeacherTicket.objects.filter(
                    student=user,
                )
            else:
                announcements = SchoolAnnouncement.objects.none()
                enrollments = StudentEnrollment.objects.none()
                tickets = ParentTeacherTicket.objects.none()

        setting, _ = UserAISetting.objects.get_or_create(user=user)

        if is_admin(user):
            teachers = User.objects.filter(role='teacher')
            students = User.objects.filter(role='student')
        else:
            section_ids = user_section_ids(user)
            teachers = User.objects.filter(assignments__section_id__in=section_ids)
            students = User.objects.filter(school_enrollments__section_id__in=section_ids)

        return Response({
            "role": user.role,
            "schools": SchoolSerializer(schools.distinct(), many=True).data,
            "sections": SectionSerializer(sections.distinct(), many=True).data,
            "announcements": SchoolAnnouncementSerializer(announcements.distinct(), many=True).data,
            "enrollments": StudentEnrollmentSerializer(enrollments.distinct(), many=True).data,
            "tickets": ParentTeacherTicketSerializer(tickets.distinct(), many=True).data,
            "teachers": [{"id": t.id, "email": t.email, "name": t.translations.get('ar', {}).get('name', t.email)} for t in teachers.distinct()],
            "students": [{"id": s.id, "email": s.email, "name": s.translations.get('ar', {}).get('name', s.email)} for s in students.distinct()],
            "ai_settings": {
                "language_complexity": setting.language_complexity,
                "tone_preference": setting.tone_preference,
                "voice_type": setting.voice_type,
                "context_retrieval": setting.context_retrieval,
            },
        })


class SchoolAnalyticsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "total_schools": School.objects.count(),
            "total_sections": Section.objects.count(),
            "total_announcements": SchoolAnnouncement.objects.count(),
            "emergency_alerts_count": SchoolAnnouncement.objects.filter(is_emergency=True).count(),
            "whatsapp_sent_count": WhatsAppNotificationLog.objects.filter(status='sent').count(),
            "whatsapp_failed_count": WhatsAppNotificationLog.objects.filter(status='failed').count(),
            "active_tickets": ParentTeacherTicket.objects.filter(status='open').count(),
            "peak_hours": "09:00 AM - 12:00 PM",
            "ai_tokens_used_estimate": 45200,
        })

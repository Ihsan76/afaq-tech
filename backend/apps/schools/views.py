from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
    UserAISetting,
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


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class SectionViewSet(viewsets.ModelViewSet):
    queryset = Section.objects.all()
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = StudentEnrollment.objects.all()
    serializer_class = StudentEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class SchoolAnnouncementViewSet(viewsets.ModelViewSet):
    queryset = SchoolAnnouncement.objects.all()
    serializer_class = SchoolAnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
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

    def perform_create(self, serializer):
        serializer.save(parent=self.request.user)

    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        ticket = self.get_object()
        text = request.data.get('message')
        if not text:
            return Response({'error': 'Message text is required'}, status=status.HTTP_400_BAD_REQUEST)

        messages_list = ticket.messages or []
        messages_list.append({
            'sender': request.user.email,
            'role': request.user.role,
            'text': text,
            'timestamp': str(request.user.date_joined)
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

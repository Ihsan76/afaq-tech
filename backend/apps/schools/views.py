from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
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
        # If emergency, trigger WhatsApp alert to enrolled parents in section/school
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
            'timestamp': str(request.user.date_joined) # or current ISO
        })
        ticket.messages = messages_list
        ticket.save()
        return Response(ParentTeacherTicketSerializer(ticket).data)

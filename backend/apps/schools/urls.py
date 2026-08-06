from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    ParentTeacherTicketViewSet,
    SchoolAnalyticsAPIView,
    SchoolAnnouncementViewSet,
    SchoolViewSet,
    SectionViewSet,
    StudentEnrollmentViewSet,
    TeacherAssignmentViewSet,
    UserSettingsAPIView,
    VoiceSynthesizeAPIView,
    VoiceTranscribeAPIView,
)

router = DefaultRouter()
router.register('schools', SchoolViewSet, basename='school')
router.register('academic-years', AcademicYearViewSet, basename='academicyear')
router.register('sections', SectionViewSet, basename='section')
router.register('enrollments', StudentEnrollmentViewSet, basename='enrollment')
router.register('teacher-assignments', TeacherAssignmentViewSet, basename='teacherassignment')
router.register('announcements', SchoolAnnouncementViewSet, basename='announcement')
router.register('tickets', ParentTeacherTicketViewSet, basename='ticket')

urlpatterns = [
    path('user/settings/', UserSettingsAPIView.as_view(), name='user-ai-settings'),
    path('voice/transcribe/', VoiceTranscribeAPIView.as_view(), name='voice-transcribe'),
    path('voice/synthesize/', VoiceSynthesizeAPIView.as_view(), name='voice-synthesize'),
    path('analytics/', SchoolAnalyticsAPIView.as_view(), name='school-analytics'),
    path('', include(router.urls)),
]

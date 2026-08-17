from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    AssignmentSubmissionViewSet,
    AssignmentViewSet,
    AttachmentViewSet,
    AttendanceViewSet,
    BiometricWebhookAPIView,
    BookViewSet,
    BusRouteViewSet,
    BulkExportView,
    BulkImportView,
    FamilyLinkViewSet,
    FAQCopilotAPIView,
    FAQViewSet,
    GradeCategoryViewSet,
    GradeEntryViewSet,
    LibraryLendingViewSet,
    MySchoolContextAPIView,
    ParentTeacherTicketViewSet,
    PeriodViewSet,
    RoomViewSet,
    SchoolAnalyticsAPIView,
    SchoolAnnouncementViewSet,
    SchoolBusViewSet,
    SchoolFeeViewSet,
    SchoolGradeViewSet,
    SchoolSubjectPeriodViewSet,
    SchoolTeacherViewSet,
    SchoolViewSet,
    SectionViewSet,
    StudentBusAssignmentViewSet,
    StudentEnrollmentViewSet,
    StudentFeeAssignmentViewSet,
    StudentPredictiveAnalyticsAPIView,
    StudentReportCardPDFView,
    SupportRequestCreateView,
    TeacherAssignmentViewSet,
    TimetableSlotViewSet,
    UserSettingsAPIView,
    VoiceSynthesizeAPIView,
    VoiceTranscribeAPIView,
    WeeklySummaryAPIView,
)

router = DefaultRouter()
router.register('schools', SchoolViewSet, basename='school')
router.register('academic-years', AcademicYearViewSet, basename='academicyear')
router.register('sections', SectionViewSet, basename='section')
router.register('school-grades', SchoolGradeViewSet, basename='schoolgrade')
router.register('school-subject-periods', SchoolSubjectPeriodViewSet, basename='schoolsubjectperiod')
router.register('school-teachers', SchoolTeacherViewSet, basename='schoolteacher')
router.register('enrollments', StudentEnrollmentViewSet, basename='enrollment')
router.register('teacher-assignments', TeacherAssignmentViewSet, basename='teacherassignment')
router.register('announcements', SchoolAnnouncementViewSet, basename='announcement')
router.register('tickets', ParentTeacherTicketViewSet, basename='ticket')
router.register('family-links', FamilyLinkViewSet, basename='familylink')
router.register('faqs', FAQViewSet, basename='faq')
router.register('attachments', AttachmentViewSet, basename='attachment')
router.register('attendances', AttendanceViewSet, basename='attendance')
router.register('periods', PeriodViewSet, basename='period')
router.register('rooms', RoomViewSet, basename='room')
router.register('timetable-slots', TimetableSlotViewSet, basename='timetableslot')
router.register('fees', SchoolFeeViewSet, basename='schoolfee')
router.register('fee-assignments', StudentFeeAssignmentViewSet, basename='studentfeeassignment')
router.register('buses', SchoolBusViewSet, basename='schoolbus')
router.register('bus-routes', BusRouteViewSet, basename='busroute')
router.register('bus-assignments', StudentBusAssignmentViewSet, basename='studentbusassignment')
router.register('books', BookViewSet, basename='book')
router.register('library-lendings', LibraryLendingViewSet, basename='librarylending')
router.register('grade-categories', GradeCategoryViewSet, basename='gradecategory')
router.register('grade-entries', GradeEntryViewSet, basename='gradeentry')
router.register('assignments', AssignmentViewSet, basename='assignment')
router.register('assignment-submissions', AssignmentSubmissionViewSet, basename='assignmentsubmission')

urlpatterns = [
    path('user/settings/', UserSettingsAPIView.as_view(), name='user-ai-settings'),
    path('my-context/', MySchoolContextAPIView.as_view(), name='my-school-context'),
    path('voice/transcribe/', VoiceTranscribeAPIView.as_view(), name='voice-transcribe'),
    path('voice/synthesize/', VoiceSynthesizeAPIView.as_view(), name='voice-synthesize'),
    path('analytics/', SchoolAnalyticsAPIView.as_view(), name='school-analytics'),
    path('weekly-summary/', WeeklySummaryAPIView.as_view(), name='weekly-summary'),
    path('support/email/', SupportRequestCreateView.as_view(), name='support-email'),
    path('bulk/import/', BulkImportView.as_view(), name='bulk-import'),
    path('bulk/export/', BulkExportView.as_view(), name='bulk-export'),
    path('students/<int:student_id>/report-card/pdf/', StudentReportCardPDFView.as_view(), name='student-report-card-pdf'),
    path('students/<int:student_id>/predictive-analytics/', StudentPredictiveAnalyticsAPIView.as_view(), name='student-predictive-analytics'),
    path('biometric/webhook/', BiometricWebhookAPIView.as_view(), name='biometric-webhook'),
    path('faq-copilot/', FAQCopilotAPIView.as_view(), name='faq-copilot'),
    path('', include(router.urls)),
]

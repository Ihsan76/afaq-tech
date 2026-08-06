from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    ParentTeacherTicketViewSet,
    SchoolAnnouncementViewSet,
    SchoolViewSet,
    SectionViewSet,
    StudentEnrollmentViewSet,
    TeacherAssignmentViewSet,
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
    path('', include(router.urls)),
]

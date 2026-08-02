from django.urls import path

from . import views

urlpatterns = [
    # Admin — MUST come BEFORE slug catch-all
    path('admin/list/', views.CourseAdminListView.as_view(), name='course-admin-list'),
    path('admin/create/', views.CourseAdminCreateView.as_view(), name='course-admin-create'),
    path('admin/<int:pk>/', views.CourseAdminUpdateView.as_view(), name='course-admin-update'),

    # Public — specific paths BEFORE slug catch-all
    path('categories/', views.CourseCategoryListView.as_view(), name='course-categories'),
    path('my/', views.MyEnrollmentsView.as_view(), name='my-enrollments'),
    path('lessons/<int:lesson_id>/complete/', views.LessonCompleteView.as_view(), name='lesson-complete'),
    path('', views.CoursePublicListView.as_view(), name='course-list'),
    path('<slug:slug>/', views.CoursePublicDetailView.as_view(), name='course-detail'),
    path('<slug:slug>/enroll/', views.CourseEnrollView.as_view(), name='course-enroll'),
    path('<slug:slug>/completed/', views.MyCompletedLessonsView.as_view(), name='course-completed'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('', views.LessonPlanListView.as_view(), name='lessonplan-list'),
    path('<int:pk>/', views.LessonPlanDetailView.as_view(), name='lessonplan-detail'),
    path('generate/', views.generate_lesson_plan, name='lessonplan-generate'),
    path('<int:pk>/duplicate/', views.duplicate_lesson_plan, name='lessonplan-duplicate'),
]

from django.urls import path
from . import views

urlpatterns = [
    path('', views.LessonPlanListView.as_view(), name='lessonplan-list'),
    path('marketplace/', views.MarketplaceListView.as_view(), name='lessonplan-marketplace'),
    path('smart-prompts/', views.smart_prompts_view, name='lessonplan-smart-prompts'),
    path('generate/', views.generate_lesson_plan, name='lessonplan-generate'),
    path('<int:pk>/', views.LessonPlanDetailView.as_view(), name='lessonplan-detail'),
    path('<int:pk>/duplicate/', views.duplicate_lesson_plan, name='lessonplan-duplicate'),
    path('<int:pk>/refine/', views.refine_lesson_plan_view, name='lessonplan-refine'),
    path('<int:pk>/clone/', views.clone_marketplace_plan_view, name='lessonplan-clone'),
    path('<int:pk>/like/', views.toggle_like_view, name='lessonplan-like'),
    path('<int:pk>/delete/', views.delete_lesson_plan_view, name='lessonplan-delete'),
    path('<int:pk>/toggle-public/', views.toggle_public_view, name='lessonplan-toggle-public'),
    path('<int:pk>/worksheet/', views.generate_worksheet_view, name='lessonplan-worksheet'),
    path('<int:pk>/homework/', views.generate_homework_view, name='lessonplan-homework'),
]


from django.urls import path
from . import views

urlpatterns = [
    path('grades/', views.GradeListView.as_view(), name='grade-list'),
    path('grades/create/', views.GradeCreateView.as_view(), name='grade-create'),
    path('grades/<int:pk>/', views.GradeDetailView.as_view(), name='grade-detail'),
    path('subjects/', views.SubjectListView.as_view(), name='subject-list'),
    path('subjects/create/', views.SubjectCreateView.as_view(), name='subject-create'),
    path('subjects/<int:pk>/', views.SubjectDetailView.as_view(), name='subject-detail'),
    path('curricula/', views.CurriculumListView.as_view(), name='curriculum-list'),
    path('curricula/create/', views.CurriculumCreateView.as_view(), name='curriculum-create'),
    path('curricula/<int:pk>/', views.CurriculumDetailView.as_view(), name='curriculum-detail'),
    path('curricula/<int:curriculum_id>/units/', views.UnitListView.as_view(), name='unit-list'),
    path('curricula/<int:curriculum_id>/units/create/', views.UnitCreateView.as_view(), name='unit-create'),
    path('curricula/<int:curriculum_id>/documents/', views.CurriculumDocumentListView.as_view(), name='document-list'),
    path('curricula/<int:curriculum_id>/documents/upload/', views.CurriculumDocumentCreateView.as_view(), name='document-upload'),
    path('units/<int:pk>/', views.UnitDetailView.as_view(), name='unit-detail'),
    path('documents/<int:pk>/', views.CurriculumDocumentDetailView.as_view(), name='document-detail'),
]

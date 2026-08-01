from django.urls import path
from . import views

urlpatterns = [
    path('languages/', views.LanguagePublicListView.as_view(), name='language-list'),
    path('admin/languages/', views.LanguageAdminListView.as_view(), name='language-admin-list'),
    path('admin/languages/create/', views.LanguageAdminCreateView.as_view(), name='language-admin-create'),
    path('admin/languages/<int:pk>/', views.LanguageAdminUpdateView.as_view(), name='language-admin-update'),
    path('admin/languages/<int:pk>/delete/', views.language_delete, name='language-admin-delete'),
    path('translations/', views.TranslationPublicListView.as_view(), name='translation-list'),
    path('admin/translations/', views.TranslationAdminListView.as_view(), name='translation-admin-list'),
    path('admin/translations/create/', views.TranslationAdminCreateView.as_view(), name='translation-admin-create'),
    path('admin/translations/<int:pk>/', views.TranslationAdminUpdateView.as_view(), name='translation-admin-update'),
    path('admin/translations/<int:pk>/delete/', views.translation_delete, name='translation-admin-delete'),
]

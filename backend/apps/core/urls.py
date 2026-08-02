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
    path('feature-flags/', views.FeatureFlagPublicListView.as_view(), name='feature-flag-list'),
    path('admin/feature-flags/', views.FeatureFlagAdminListView.as_view(), name='feature-flag-admin-list'),
    path('admin/feature-flags/create/', views.FeatureFlagAdminCreateView.as_view(), name='feature-flag-admin-create'),
    path('admin/feature-flags/<int:pk>/', views.FeatureFlagAdminUpdateView.as_view(), name='feature-flag-admin-update'),
    path('admin/feature-flags/<int:pk>/delete/', views.feature_flag_delete, name='feature-flag-admin-delete'),
    path('admin/stats/', views.admin_stats, name='admin-stats'),
    path('health/', views.health_view, name='health'),
]

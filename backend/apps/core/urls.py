from django.urls import path

from . import views
from .classroom_views import (
    GoogleClassroomAuthView,
    GoogleClassroomCoursesView,
    GoogleClassroomExportGradesView,
    GoogleClassroomImportStudentsView,
)
from .directorate_views import (
    DirectorateAlertsView,
    DirectorateComparisonView,
    DirectorateDashboardView,
    DirectorateListView,
    DirectorateSchoolsView,
    DirectorateStatsView,
)
from .gdpr_views import (
    ConsentCreateView,
    ConsentListView,
    DataExportView,
    DeletionRequestStatusView,
    DeletionRequestView,
)
from .search_views import AutocompleteView, GlobalSearchView

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
    path('search/', GlobalSearchView.as_view(), name='global-search'),
    path('search/autocomplete/', AutocompleteView.as_view(), name='search-autocomplete'),
    path('consent/', ConsentListView.as_view(), name='consent-list'),
    path('consent/create/', ConsentCreateView.as_view(), name='consent-create'),
    path('deletion-request/', DeletionRequestView.as_view(), name='deletion-request'),
    path('deletion-request/status/', DeletionRequestStatusView.as_view(), name='deletion-request-status'),
    path('data-export/', DataExportView.as_view(), name='data-export'),
    path('directorates/', DirectorateListView.as_view(), name='directorate-list'),
    path('directorates/<int:pk>/dashboard/', DirectorateDashboardView.as_view(), name='directorate-dashboard'),
    path('directorates/<int:pk>/stats/', DirectorateStatsView.as_view(), name='directorate-stats'),
    path('directorates/<int:pk>/schools/', DirectorateSchoolsView.as_view(), name='directorate-schools'),
    path('directorates/<int:pk>/comparison/', DirectorateComparisonView.as_view(), name='directorate-comparison'),
    path('directorates/<int:pk>/alerts/', DirectorateAlertsView.as_view(), name='directorate-alerts'),
    path('google-classroom/auth/', GoogleClassroomAuthView.as_view(), name='classroom-auth'),
    path('google-classroom/courses/', GoogleClassroomCoursesView.as_view(), name='classroom-courses'),
    path('google-classroom/import/students/', GoogleClassroomImportStudentsView.as_view(), name='classroom-import-students'),
    path('google-classroom/export/grades/', GoogleClassroomExportGradesView.as_view(), name='classroom-export-grades'),
]

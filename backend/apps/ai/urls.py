from django.urls import path

from . import views

urlpatterns = [
    path('chat/', views.chat_stream_view, name='ai-chat'),
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/create/', views.ConversationCreateView.as_view(), name='conversation-create'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:pk>/delete/', views.ConversationDeleteView.as_view(), name='conversation-delete'),
    path('conversations/<int:pk>/clear/', views.conversation_clear_view, name='conversation-clear'),
    path('admin/models/', views.AIModelAdminListView.as_view(), name='aimodel-admin-list'),
    path('admin/models/<int:pk>/', views.AIModelAdminDetailView.as_view(), name='aimodel-admin-detail'),
    path('admin/fetch-models/', views.fetch_provider_models, name='aimodel-fetch-models'),
    path('admin/import-models/', views.import_provider_models, name='aimodel-import-models'),
    path('admin/providers/', views.AIProviderListCreateView.as_view(), name='aiprovider-list'),
    path('admin/providers/<int:pk>/', views.AIProviderDetailView.as_view(), name='aiprovider-detail'),
    path('admin/providers/test/', views.test_provider_connection, name='aiprovider-test'),
    path('admin/provider-types/', views.ProviderTypeListView.as_view(), name='providertype-list'),
    path('models/', views.AIModelPublicListView.as_view(), name='aimodel-public-list'),

    # Prompt management
    path('admin/prompt-templates/', views.PromptTemplateListView.as_view(), name='prompttemplate-list'),
    path('admin/prompt-templates/<int:pk>/', views.PromptTemplateDetailView.as_view(), name='prompttemplate-detail'),
    path('admin/grade-prompt-profiles/', views.GradePromptProfileListView.as_view(), name='gradepromptprofile-list'),
    path('admin/grade-prompt-profiles/<int:pk>/', views.GradePromptProfileDetailView.as_view(), name='gradepromptprofile-detail'),
    path('admin/subject-prompt-profiles/', views.SubjectPromptProfileListView.as_view(), name='subjectpromptprofile-list'),
    path('admin/subject-prompt-profiles/<int:pk>/', views.SubjectPromptProfileDetailView.as_view(), name='subjectpromptprofile-detail'),
    path('admin/air-runs/', views.AIRunAdminListView.as_view(), name='airun-admin-list'),
    path('admin/air-runs/stats/', views.air_run_stats, name='airun-admin-stats'),
]

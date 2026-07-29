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
    path('models/', views.AIModelPublicListView.as_view(), name='aimodel-public-list'),
]

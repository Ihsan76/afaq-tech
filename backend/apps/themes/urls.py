from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('', views.ThemeListView.as_view(), name='theme-list'),
    path('<int:pk>/', views.ThemeDetailView.as_view(), name='theme-detail'),

    # Admin
    path('admin/', views.ThemeAdminListView.as_view(), name='theme-admin-list'),
    path('admin/create/', views.ThemeAdminCreateView.as_view(), name='theme-admin-create'),
    path('admin/<int:pk>/', views.ThemeAdminUpdateView.as_view(), name='theme-admin-update'),
    path('admin/<int:pk>/delete/', views.ThemeAdminDeleteView.as_view(), name='theme-admin-delete'),
]

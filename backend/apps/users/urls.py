from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    # Admin
    path('admin/list/', views.UserAdminListView.as_view(), name='user-admin-list'),
    path('admin/<int:pk>/', views.UserAdminUpdateView.as_view(), name='user-admin-update'),
    path('me/stats/', views.user_stats_view, name='user-stats'),
]

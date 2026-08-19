from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register('role-requests', views.RoleRequestViewSet, basename='rolerequest')

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('forgot-password/', views.ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', views.ResetPasswordView.as_view(), name='reset_password'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='verify_email'),
    path('verify-email/confirm/', views.VerifyEmailConfirmView.as_view(), name='verify_email_confirm'),
    path('verify-phone/', views.VerifyPhoneView.as_view(), name='verify_phone'),
    path('verify-phone/confirm/', views.VerifyPhoneConfirmView.as_view(), name='verify_phone_confirm'),
    path('google/', views.GoogleLoginView.as_view(), name='google_login'),
    path('google/callback/', views.GoogleCallbackView.as_view(), name='google_callback'),
    # Admin
    path('admin/list/', views.UserAdminListView.as_view(), name='user-admin-list'),
    path('admin/<int:pk>/', views.UserAdminUpdateView.as_view(), name='user-admin-update'),
    path('me/stats/', views.user_stats_view, name='user-stats'),
    # Role Management
    path('my-roles/', views.MyRolesView.as_view(), name='my-roles'),
    path('users/<int:user_id>/roles/', views.UserRolesView.as_view(), name='user-roles'),
    path('assign-role/', views.RoleAssignmentView.as_view(), name='assign-role'),
    path('revoke-role/', views.RoleRevokeView.as_view(), name='revoke-role'),
    # Role Requests
    path('my-requests/', views.MyRoleRequestsView.as_view(), name='my-role-requests'),
    path('', include(router.urls)),
]

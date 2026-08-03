from django.urls import path

from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plan-list'),
    path('current/', views.current_subscription, name='subscription-current'),
    path('purchase/', views.purchase_subscription, name='subscription-purchase'),
    path('usage/', views.usage_summary, name='subscription-usage'),
    path('organizations/my/', views.my_organization, name='organization-my'),
    path('organizations/my/invites/', views.invite_teacher_view, name='organization-invite'),
    path('organizations/my/invites/<str:token>/', views.cancel_invite, name='organization-cancel-invite'),
    path('organizations/my/members/<int:member_id>/remove/', views.remove_member, name='organization-remove-member'),
    path('organizations/my/members/<int:member_id>/role/', views.set_member_role, name='organization-member-role'),
    path('organizations/my/extra-seats/', views.extra_seats_purchase, name='organization-extra-seats'),
    path('organizations/invites/<str:token>/', views.org_invite_info, name='organization-invite-info'),
    path('organizations/invites/<str:token>/accept/', views.accept_org_invite, name='organization-invite-accept'),
    path('admin/plans/', views.AdminPlanListCreateView.as_view(), name='admin-plan-list'),
    path('admin/plans/<int:pk>/', views.AdminPlanDetailView.as_view(), name='admin-plan-detail'),
    path('admin/plans/<int:pk>/services/', views.AdminPlanServicesView.as_view(), name='admin-plan-services'),
    path('admin/services/', views.AdminServiceListCreateView.as_view(), name='admin-service-list'),
    path('admin/services/<int:pk>/', views.AdminServiceDetailView.as_view(), name='admin-service-detail'),
    path('admin/organizations/', views.AdminOrganizationListCreateView.as_view(), name='admin-organization-list'),
    path('admin/organizations/<int:pk>/', views.AdminOrganizationDetailView.as_view(), name='admin-organization-detail'),
    path('admin/organizations/<int:pk>/members/', views.admin_organization_members, name='admin-organization-members'),
]

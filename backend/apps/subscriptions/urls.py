from django.urls import path

from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plan-list'),
    path('current/', views.current_subscription, name='subscription-current'),
    path('purchase/', views.purchase_subscription, name='subscription-purchase'),
    path('usage/', views.usage_summary, name='subscription-usage'),
    path('admin/plans/', views.AdminPlanListCreateView.as_view(), name='admin-plan-list'),
    path('admin/plans/<int:pk>/', views.AdminPlanDetailView.as_view(), name='admin-plan-detail'),
    path('admin/plans/<int:pk>/services/', views.AdminPlanServicesView.as_view(), name='admin-plan-services'),
    path('admin/services/', views.AdminServiceListCreateView.as_view(), name='admin-service-list'),
    path('admin/services/<int:pk>/', views.AdminServiceDetailView.as_view(), name='admin-service-detail'),
]

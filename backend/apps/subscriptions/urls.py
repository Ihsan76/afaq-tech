from django.urls import path

from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plan-list'),
    path('current/', views.current_subscription, name='subscription-current'),
    path('purchase/', views.purchase_subscription, name='subscription-purchase'),
    path('admin/plans/', views.AdminPlanListCreateView.as_view(), name='admin-plan-list'),
    path('admin/plans/<int:pk>/', views.AdminPlanDetailView.as_view(), name='admin-plan-detail'),
]

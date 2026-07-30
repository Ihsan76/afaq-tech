from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.ServiceCategoryListView.as_view(), name='service-category-list'),
    path('services/', views.ServiceListView.as_view(), name='service-list'),
    path('services/<int:pk>/', views.ServiceDetailView.as_view(), name='service-detail'),
    path('services/<int:service_pk>/availability/', views.ServiceAvailabilityListView.as_view(), name='service-availability-list'),
    path('orders/', views.OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/complete/', views.complete_order, name='order-complete'),
    path('orders/<int:pk>/cancel/', views.cancel_order, name='order-cancel'),
    path('reviews/', views.ReviewListView.as_view(), name='review-list'),
]

from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('categories/', views.EbookCategoryListView.as_view(), name='ebook-categories'),
    path('', views.EbookListView.as_view(), name='ebook-list'),
    path('<slug:slug>/', views.EbookDetailView.as_view(), name='ebook-detail'),
    path('<slug:slug>/download/', views.EbookDownloadView.as_view(), name='ebook-download'),

    # Admin
    path('admin/list/', views.EbookAdminListView.as_view(), name='ebook-admin-list'),
    path('admin/create/', views.EbookAdminCreateView.as_view(), name='ebook-admin-create'),
    path('admin/<int:pk>/', views.EbookAdminUpdateView.as_view(), name='ebook-admin-update'),
    path('admin/<int:pk>/delete/', views.EbookAdminDeleteView.as_view(), name='ebook-admin-delete'),
    path('admin/categories/create/', views.EbookCategoryAdminCreateView.as_view(), name='ebook-cat-admin-create'),
    path('admin/categories/<int:pk>/', views.EbookCategoryAdminUpdateView.as_view(), name='ebook-cat-admin-update'),
    path('admin/categories/<int:pk>/delete/', views.EbookCategoryAdminDeleteView.as_view(), name='ebook-cat-admin-delete'),
]

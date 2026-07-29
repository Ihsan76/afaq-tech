from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('categories/', views.BlogCategoryListView.as_view(), name='blog-categories'),
    path('posts/', views.BlogPostPublicListView.as_view(), name='blog-post-list'),
    path('posts/<slug:slug>/', views.BlogPostPublicDetailView.as_view(), name='blog-post-detail'),
    path('related/<slug:slug>/', views.blog_related_posts, name='blog-related'),

    # Admin
    path('admin/categories/', views.BlogCategoryAdminListView.as_view(), name='blog-admin-categories'),
    path('admin/categories/create/', views.BlogCategoryAdminCreateView.as_view(), name='blog-admin-category-create'),
    path('admin/categories/<int:pk>/', views.BlogCategoryAdminUpdateView.as_view(), name='blog-admin-category-update'),
    path('admin/posts/', views.BlogPostAdminListView.as_view(), name='blog-admin-posts'),
    path('admin/posts/create/', views.BlogPostAdminCreateView.as_view(), name='blog-admin-post-create'),
    path('admin/posts/<int:pk>/', views.BlogPostAdminUpdateView.as_view(), name='blog-admin-post-update'),
]

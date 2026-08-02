from django.urls import path

from . import views

urlpatterns = [
    # Admin — MUST come BEFORE slug catch-all
    path('admin/pages/', views.PageAdminListView.as_view(), name='page-admin-list'),
    path('admin/pages/create/', views.PageAdminCreateView.as_view(), name='page-admin-create'),
    path('admin/pages/<int:pk>/', views.PageAdminUpdateView.as_view(), name='page-admin-update'),
    path('admin/pages/<int:pk>/delete/', views.PageAdminDeleteView.as_view(), name='page-admin-delete'),

    # Admin — Blocks
    path('admin/pages/<int:page_id>/blocks/', views.BlockListCreateView.as_view(), name='block-list-create'),
    path('admin/pages/<int:page_id>/blocks/<int:pk>/', views.BlockUpdateDeleteView.as_view(), name='block-update-delete'),
    path('admin/pages/<int:page_id>/blocks/reorder/', views.BlockReorderView.as_view(), name='block-reorder'),

    # Admin — Menus
    path('admin/menus/', views.MenuAdminListView.as_view(), name='menu-admin-list'),
    path('admin/menus/create/', views.MenuAdminCreateView.as_view(), name='menu-admin-create'),
    path('admin/menus/<int:pk>/', views.MenuAdminUpdateView.as_view(), name='menu-admin-update'),
    path('admin/menus/<int:pk>/delete/', views.MenuAdminDeleteView.as_view(), name='menu-admin-delete'),
    path('admin/menus/reorder/', views.MenuReorderView.as_view(), name='menu-reorder'),

    # Admin — Templates
    path('admin/templates/', views.TemplateAdminListView.as_view(), name='template-admin-list'),
    path('admin/templates/create/', views.TemplateAdminCreateView.as_view(), name='template-admin-create'),
    path('admin/templates/<int:pk>/', views.TemplateAdminUpdateView.as_view(), name='template-admin-update'),
    path('admin/templates/<int:pk>/delete/', views.TemplateAdminDeleteView.as_view(), name='template-admin-delete'),

    # Admin — Settings
    path('admin/settings/', views.SiteSettingsAdminView.as_view(), name='settings-admin'),

    # Contact
    path('contact/submit/', views.ContactMessageCreateView.as_view(), name='contact-create'),
    path('admin/contact/', views.ContactMessageAdminListView.as_view(), name='contact-admin-list'),
    path('admin/contact/<int:pk>/', views.ContactMessageAdminUpdateView.as_view(), name='contact-admin-update'),

    # Newsletter
    path('newsletter/subscribe/', views.NewsletterSubscribeView.as_view(), name='newsletter-subscribe'),
    path('admin/newsletter/', views.NewsletterAdminListView.as_view(), name='newsletter-admin-list'),

    # Public — specific paths BEFORE slug catch-all
    path('settings/', views.SiteSettingsPublicView.as_view(), name='settings-public'),
    path('menu/<str:menu_type>/', views.MenuPublicView.as_view(), name='menu-public'),
    path('templates/list/', views.TemplateListView.as_view(), name='template-list'),
    path('<path:slug>/', views.PagePublicView.as_view(), name='page-public'),
]

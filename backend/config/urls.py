from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/academics/', include('apps.academics.urls')),
    path('api/v1/lesson-plans/', include('apps.lessonplans.urls')),
    path('api/v1/themes/', include('apps.themes.urls')),
    path('api/v1/pages/', include('apps.pages.urls')),
    path('api/v1/blog/', include('apps.blog.urls')),
    path('api/v1/ebooks/', include('apps.ebooks.urls')),
    path('api/v1/courses/', include('apps.courses.urls')),
    path('api/v1/ai/', include('apps.ai.urls')),
    path('api/v1/gamification/', include('apps.gamification.urls')),
    path('api/v1/marketplace/', include('apps.marketplace.urls')),
]

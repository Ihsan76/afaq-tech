from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, permissions

from apps.core.cache import SITE_CACHE_KEY_PREFIX, SITE_CACHE_TTL
from .models import Theme
from .serializers import ThemeListSerializer, ThemeSerializer


@method_decorator(cache_page(SITE_CACHE_TTL, key_prefix=SITE_CACHE_KEY_PREFIX), name='dispatch')
class ThemeListView(generics.ListAPIView):
    queryset = Theme.objects.filter(is_active=True)
    serializer_class = ThemeListSerializer
    permission_classes = [permissions.AllowAny]


@method_decorator(cache_page(SITE_CACHE_TTL, key_prefix=SITE_CACHE_KEY_PREFIX), name='dispatch')
class ThemeDetailView(generics.RetrieveAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [permissions.AllowAny]


class ThemeAdminListView(generics.ListAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [permissions.IsAdminUser]


class ThemeAdminCreateView(generics.CreateAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [permissions.IsAdminUser]


class ThemeAdminUpdateView(generics.UpdateAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [permissions.IsAdminUser]


class ThemeAdminDeleteView(generics.DestroyAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [permissions.IsAdminUser]

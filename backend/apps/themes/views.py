from django.core.cache import cache
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import SITE_CACHE_TTL, _public_key
from apps.users.permissions import IsSettingsAdmin

from .models import Theme
from .serializers import ThemeListSerializer, ThemeSerializer


class ThemeListView(APIView):
    """قائمة الثيمات النشطة — الرد مُخزّن في Redis"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('themes', locale)
        data = cache.get(key)
        if data is None:
            serializer = ThemeListSerializer(
                Theme.objects.filter(is_active=True), many=True, context={'request': request}
            )
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class ThemeDetailView(APIView):
    """جلب ثيم — الرد مُخزّن في Redis"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('theme', pk, locale)
        data = cache.get(key)
        if data is None:
            theme = get_object_or_404(Theme, pk=pk)
            serializer = ThemeSerializer(theme, context={'request': request})
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class ThemeAdminListView(generics.ListAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [IsSettingsAdmin]


class ThemeAdminCreateView(generics.CreateAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [IsSettingsAdmin]


class ThemeAdminUpdateView(generics.UpdateAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [IsSettingsAdmin]


class ThemeAdminDeleteView(generics.DestroyAPIView):
    queryset = Theme.objects.all()
    serializer_class = ThemeSerializer
    permission_classes = [IsSettingsAdmin]

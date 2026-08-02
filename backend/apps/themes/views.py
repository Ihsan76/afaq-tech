from rest_framework import generics, permissions

from .models import Theme
from .serializers import ThemeListSerializer, ThemeSerializer


class ThemeListView(generics.ListAPIView):
    queryset = Theme.objects.filter(is_active=True)
    serializer_class = ThemeListSerializer
    permission_classes = [permissions.AllowAny]


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

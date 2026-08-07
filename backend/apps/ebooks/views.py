from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from apps.users.permissions import IsContentAdmin
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Ebook, EbookCategory
from .serializers import (
    EbookCategorySerializer,
    EbookCreateUpdateSerializer,
    EbookDetailSerializer,
    EbookListSerializer,
)

PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}


class EbookCategoryListView(generics.ListAPIView):
    serializer_class = EbookCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = EbookCategory.objects.filter(is_active=True)


class EbookListView(generics.ListAPIView):
    serializer_class = EbookListSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = Ebook.objects.filter(is_published=True).select_related('category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        access = self.request.query_params.get('access')
        if access:
            qs = qs.filter(access_level=access)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(translations__en__title__icontains=search) |
                Q(translations__en__description__icontains=search) |
                Q(translations__ar__title__icontains=search) |
                Q(translations__ar__description__icontains=search) |
                Q(slug__icontains=search) |
                Q(tags__icontains=search)
            )
        return qs


class EbookDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        ebook = get_object_or_404(Ebook, slug=slug, is_published=True)
        serializer = EbookDetailSerializer(ebook, context={'request': request})
        return Response(serializer.data)


class EbookDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        ebook = get_object_or_404(Ebook, slug=slug, is_published=True)

        user_level = 0
        if request.user and request.user.is_authenticated:
            user_level = PLAN_LEVELS.get(request.user.subscription_plan, 0)

        required_level = PLAN_LEVELS.get(ebook.access_level, 0)
        if user_level < required_level:
            return Response(
                {'success': False, 'message': 'Subscription required', 'required_level': ebook.access_level},
                status=status.HTTP_403_FORBIDDEN
            )

        ebook.download_count += 1
        ebook.save(update_fields=['download_count'])
        return Response({'success': True, 'file_url': ebook.file_url})


class EbookAdminListView(generics.ListAPIView):
    serializer_class = EbookListSerializer
    permission_classes = [IsContentAdmin]
    queryset = Ebook.objects.all()

    def get_serializer_context(self):
        return {'request': self.request}


class EbookAdminCreateView(generics.CreateAPIView):
    serializer_class = EbookCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class EbookAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Ebook.objects.all()
    serializer_class = EbookDetailSerializer
    permission_classes = [IsContentAdmin]

    def get_serializer_context(self):
        return {'request': self.request}


class EbookAdminDeleteView(generics.DestroyAPIView):
    queryset = Ebook.objects.all()
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminCreateView(generics.CreateAPIView):
    serializer_class = EbookCategorySerializer
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = EbookCategory.objects.all()
    serializer_class = EbookCategorySerializer
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminDeleteView(generics.DestroyAPIView):
    queryset = EbookCategory.objects.all()
    permission_classes = [IsContentAdmin]

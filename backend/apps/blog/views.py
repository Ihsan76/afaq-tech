from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import BlogCategory, BlogPost
from .serializers import (
    BlogCategorySerializer,
    BlogPostListSerializer,
    BlogPostDetailSerializer,
    BlogPostCreateUpdateSerializer,
)


# ── Public ──

class BlogCategoryListView(generics.ListAPIView):
    """Blog categories — public"""
    queryset = BlogCategory.objects.filter(is_active=True)
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.AllowAny]


class BlogPostPublicListView(generics.ListAPIView):
    """Published blog posts — public"""
    serializer_class = BlogPostListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = BlogPost.objects.filter(is_published=True)
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category__slug=cat)
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(translations__en__title__icontains=search) |
                Q(translations__en__excerpt__icontains=search) |
                Q(translations__ar__title__icontains=search) |
                Q(translations__ar__excerpt__icontains=search) |
                Q(slug__icontains=search)
            )
        return qs


class BlogPostPublicDetailView(generics.RetrieveAPIView):
    """Single blog post — public"""
    serializer_class = BlogPostDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return BlogPost.objects.filter(is_published=True)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def blog_related_posts(request, slug):
    """Get posts related to a service URL"""
    posts = BlogPost.objects.filter(is_published=True, related_service=f'/services/{slug}')[:3]
    serializer = BlogPostListSerializer(posts, many=True)
    return Response(serializer.data)


# ── Admin ──

class BlogCategoryAdminListView(generics.ListAPIView):
    """All categories — admin"""
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class BlogCategoryAdminCreateView(generics.CreateAPIView):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class BlogCategoryAdminUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class BlogPostAdminListView(generics.ListAPIView):
    """All posts — admin"""
    serializer_class = BlogPostListSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return BlogPost.objects.all()


class BlogPostAdminCreateView(generics.CreateAPIView):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]


class BlogPostAdminUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BlogPost.objects.all()
    serializer_class = BlogPostCreateUpdateSerializer
    permission_classes = [permissions.IsAdminUser]

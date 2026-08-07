from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response

from apps.users.permissions import IsAdminRole, IsSettingsAdmin

from .models import FeatureFlag, Language, TranslationKey
from .serializers import (
    FeatureFlagSerializer,
    LanguageSerializer,
    TranslationPublicSerializer,
    TranslationSerializer,
)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@throttle_classes([])
def health_view(request):
    """Liveness/health probe for load balancers and monitoring."""
    return Response({
        'status': 'ok',
        'service': 'afaq-api',
    })


class LanguagePublicListView(generics.ListAPIView):
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LanguageAdminListView(generics.ListAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [IsSettingsAdmin]
    pagination_class = None


class LanguageAdminCreateView(generics.CreateAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [IsSettingsAdmin]


class LanguageAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [IsSettingsAdmin]


@api_view(['DELETE'])
@permission_classes([IsSettingsAdmin])
def language_delete(request, pk):
    language = get_object_or_404(Language, pk=pk)
    if language.is_default:
        return Response(
            {'error': 'لا يمكن حذف اللغة الافتراضية'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    language.delete()
    return Response({'status': 'deleted'})


class TranslationPublicListView(generics.ListAPIView):
    queryset = TranslationKey.objects.filter(is_active=True)
    serializer_class = TranslationPublicSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['locale'] = self.request.query_params.get('locale')
        return context


class TranslationAdminListView(generics.ListAPIView):
    serializer_class = TranslationSerializer
    permission_classes = [IsSettingsAdmin]
    pagination_class = None

    def get_queryset(self):
        qs = TranslationKey.objects.all()
        namespace = self.request.query_params.get('namespace', '')
        q = self.request.query_params.get('q', '')
        if namespace:
            qs = qs.filter(namespace=namespace)
        if q:
            qs = qs.filter(key__icontains=q)
        return qs


class TranslationAdminCreateView(generics.CreateAPIView):
    queryset = TranslationKey.objects.all()
    serializer_class = TranslationSerializer
    permission_classes = [IsSettingsAdmin]


class TranslationAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = TranslationKey.objects.all()
    serializer_class = TranslationSerializer
    permission_classes = [IsSettingsAdmin]


@api_view(['DELETE'])
@permission_classes([IsSettingsAdmin])
def translation_delete(request, pk):
    translation = get_object_or_404(TranslationKey, pk=pk)
    translation.delete()
    return Response({'status': 'deleted'})


class FeatureFlagPublicListView(generics.ListAPIView):
    queryset = FeatureFlag.objects.filter(is_active=True)
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class FeatureFlagAdminListView(generics.ListAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsSettingsAdmin]
    pagination_class = None


class FeatureFlagAdminCreateView(generics.CreateAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsSettingsAdmin]


class FeatureFlagAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsSettingsAdmin]


@api_view(['DELETE'])
@permission_classes([IsSettingsAdmin])
def feature_flag_delete(request, pk):
    flag = get_object_or_404(FeatureFlag, pk=pk)
    flag.delete()
    return Response({'status': 'deleted'})


@api_view(['GET'])
@permission_classes([IsAdminRole])
def admin_stats(request):
    from datetime import timedelta

    from django.contrib.auth import get_user_model
    from django.db.models import Count, Sum
    from django.utils import timezone

    from apps.ai.models import AIRun
    from apps.blog.models import BlogPost
    from apps.courses.models import Course, Enrollment
    from apps.gamification.models import PointsTransaction, UserBadge
    from apps.lessonplans.models import LessonPlan
    from apps.marketplace.models import Order, Service, ServiceCategory

    User = get_user_model()
    week_ago = timezone.now() - timedelta(days=7)

    users = User.objects.all()
    orders = Order.objects.all()
    ai_runs = AIRun.objects.all()

    return Response({
        'users': {
            'total': users.count(),
            'new_7d': users.filter(date_joined__gte=week_ago).count(),
            'by_role': dict(users.values_list('role').annotate(c=Count('id')).values_list('role', 'c')),
            'by_plan': dict(users.values_list('subscription_plan').annotate(c=Count('id')).values_list('subscription_plan', 'c')),
        },
        'lesson_plans': {
            'total': LessonPlan.objects.count(),
            'published': LessonPlan.objects.filter(is_public=True).count(),
        },
        'marketplace': {
            'services': Service.objects.count(),
            'published_services': Service.objects.filter(status=Service.Status.PUBLISHED).count(),
            'categories': ServiceCategory.objects.count(),
            'orders': orders.count(),
            'orders_7d': orders.filter(created_at__gte=week_ago).count(),
            'revenue': float(orders.exclude(status=Order.Status.CANCELLED).aggregate(s=Sum('price_paid'))['s'] or 0),
            'orders_by_status': dict(orders.values_list('status').annotate(c=Count('id')).values_list('status', 'c')),
        },
        'ai': {
            'runs': ai_runs.count(),
            'runs_7d': ai_runs.filter(created_at__gte=week_ago).count(),
            'tokens': ai_runs.aggregate(s=Sum('tokens_used'))['s'] or 0,
            'cost': float(ai_runs.aggregate(s=Sum('cost'))['s'] or 0),
            'avg_duration_ms': round((ai_runs.aggregate(a=Sum('duration_ms'))['a'] or 0) / ai_runs.count() if ai_runs.count() else 0),
        },
        'blog': {
            'posts': BlogPost.objects.count(),
        },
        'courses': {
            'courses': Course.objects.count(),
            'enrollments': Enrollment.objects.count(),
        },
        'gamification': {
            'points_awarded': PointsTransaction.objects.aggregate(s=Sum('points'))['s'] or 0,
            'badges_issued': UserBadge.objects.count(),
        },
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_autocomplete_view(request):
    """إكمال تلقائي للبحث الشامل (الدورات، المقالات، الكتب الإلكترونية)"""
    q = request.GET.get('q', '').strip()
    locale = request.GET.get('locale', 'ar')
    if not q or len(q) < 2:
        return Response({'courses': [], 'blog': [], 'ebooks': []})

    from django.db.models import Q
    from apps.courses.models import Course
    from apps.blog.models import BlogPost
    from apps.ebooks.models import Ebook

    courses = Course.objects.filter(is_published=True).filter(
        Q(translations__en__title__icontains=q) |
        Q(translations__ar__title__icontains=q) |
        Q(slug__icontains=q)
    )[:5]

    posts = BlogPost.objects.filter(is_published=True).filter(
        Q(translations__en__title__icontains=q) |
        Q(translations__ar__title__icontains=q) |
        Q(slug__icontains=q)
    )[:5]

    ebooks = Ebook.objects.filter(is_published=True).filter(
        Q(translations__en__title__icontains=q) |
        Q(translations__ar__title__icontains=q) |
        Q(slug__icontains=q) |
        Q(tags__icontains=q)
    )[:5]

    return Response({
        'courses': [
            {
                'title': c.translations.get(locale, {}).get('title') or c.translations.get('ar', {}).get('title') or c.slug,
                'slug': c.slug,
                'type': 'course',
                'thumbnail': c.thumbnail,
                'url': f"/{locale}/academy/courses/{c.slug}"
            }
            for c in courses
        ],
        'blog': [
            {
                'title': p.translations.get(locale, {}).get('title') or p.translations.get('ar', {}).get('title') or p.slug,
                'slug': p.slug,
                'type': 'blog',
                'thumbnail': p.featured_image,
                'url': f"/{locale}/blog/{p.slug}"
            }
            for p in posts
        ],
        'ebooks': [
            {
                'title': e.translations.get(locale, {}).get('title') or e.translations.get('ar', {}).get('title') or e.slug,
                'slug': e.slug,
                'type': 'ebook',
                'thumbnail': e.cover_image if hasattr(e, 'cover_image') else '',
                'url': f"/{locale}/ebooks/{e.slug}"
            }
            for e in ebooks
        ],
    })

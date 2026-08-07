from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from apps.users.permissions import IsContentAdmin
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Course, CourseCategory, Enrollment, Lesson
from .serializers import (
    CourseCategorySerializer,
    CourseCreateUpdateSerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    EnrollmentSerializer,
)

# ── Public ──

class CourseCategoryListView(generics.ListAPIView):
    """تصنيفات الدورات — عام"""
    queryset = CourseCategory.objects.filter(is_active=True)
    serializer_class = CourseCategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CoursePublicListView(generics.ListAPIView):
    """قائمة الدورات المنشورة — عام"""
    serializer_class = CourseListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(is_published=True).select_related('category')
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category__slug=cat)
        level = self.request.query_params.get('level')
        if level:
            qs = qs.filter(level=level)
        language = self.request.query_params.get('language')
        if language:
            qs = qs.filter(language=language)
        free = self.request.query_params.get('free')
        if free == 'true':
            qs = qs.filter(is_free=True)
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(translations__en__title__icontains=search) |
                Q(translations__ar__title__icontains=search) |
                Q(translations__en__description__icontains=search) |
                Q(translations__ar__description__icontains=search) |
                Q(slug__icontains=search)
            )
        return qs


class CoursePublicDetailView(generics.RetrieveAPIView):
    """تفاصيل دورة — عام (الفيديوهات مقفلة لغير المسجلين في الدورات المدفوعة)"""
    serializer_class = CourseDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Course.objects.filter(is_published=True).prefetch_related('chapters__lessons')


class CourseEnrollView(APIView):
    """التسجيل في دورة — مجانية فوري، مدفوعة تتطلب دفع (لاحقاً)"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        course = get_object_or_404(Course, slug=slug, is_published=True)
        if not course.is_free:
            return Response(
                {'error': 'This course requires payment. Payment integration coming soon.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )
        enrollment, created = Enrollment.objects.get_or_create(user=request.user, course=course)
        return Response(
            {'enrolled': True, 'created': created, 'progress': enrollment.progress},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MyEnrollmentsView(generics.ListAPIView):
    """دوراتي — للمستخدم المسجل"""
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user).select_related('course__category')


class LessonCompleteView(APIView):
    """تعليم درس كمكتمل"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        enrollment = get_object_or_404(
            Enrollment, user=request.user, course=lesson.chapter.course
        )
        if lesson in enrollment.completed_lessons.all():
            enrollment.completed_lessons.remove(lesson)
            completed = False
        else:
            enrollment.completed_lessons.add(lesson)
            completed = True
        # Mark course completed if 100%
        from django.utils import timezone
        if enrollment.progress == 100 and not enrollment.completed_at:
            enrollment.completed_at = timezone.now()
            enrollment.save()
        elif enrollment.progress < 100 and enrollment.completed_at:
            enrollment.completed_at = None
            enrollment.save()
        return Response({'completed': completed, 'progress': enrollment.progress})


class MyCompletedLessonsView(APIView):
    """قائمة الدروس المكتملة للمستخدم في دورة معينة"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug):
        enrollment = get_object_or_404(Enrollment, user=request.user, course__slug=slug)
        return Response({
            'completed_lesson_ids': list(enrollment.completed_lessons.values_list('id', flat=True)),
            'progress': enrollment.progress,
        })


# ── Admin ──

class CourseAdminListView(generics.ListAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseListSerializer
    permission_classes = [IsContentAdmin]


class CourseAdminCreateView(generics.CreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class CourseAdminUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseCreateUpdateSerializer
    permission_classes = [IsContentAdmin]

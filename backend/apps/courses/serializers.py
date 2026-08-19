from rest_framework import serializers

from .models import Chapter, Course, CourseCategory, CoursePurchase, Enrollment, Lesson

PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'school': 2, 'enterprise': 3}


def _extract_field(translations_dict, field):
    """Extract a field from all locales: {ar: val, en: val, ...}"""
    if not translations_dict or not isinstance(translations_dict, dict):
        return {}
    return {
        locale: data.get(field, '')
        for locale, data in translations_dict.items()
        if isinstance(data, dict) and data.get(field)
    }


class CourseCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseCategory
        fields = ['id', 'slug', 'icon', 'order', 'name', 'description', 'courses_count']

    def get_name(self, obj):
        return _extract_field(obj.translations, 'name')

    def get_description(self, obj):
        return _extract_field(obj.translations, 'description')

    def get_courses_count(self, obj):
        return obj.courses.filter(is_published=True).count()


class LessonSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'video_url', 'duration_minutes', 'order', 'is_free_preview']

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')


class LessonLockedSerializer(serializers.ModelSerializer):
    """Lesson without video_url — for non-enrolled users"""
    title = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'duration_minutes', 'order', 'is_free_preview']

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')


class ChapterSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    lessons = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'order', 'lessons']

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')

    def get_lessons(self, obj):
        request = self.context.get('request')
        course = obj.course
        enrolled = False
        if request and request.user.is_authenticated:
            enrolled = Enrollment.objects.filter(user=request.user, course=course).exists()
        if enrolled or course.is_free:
            return LessonSerializer(obj.lessons.all(), many=True).data
        # Locked: only previews get video_url
        lessons = obj.lessons.all()
        data = LessonLockedSerializer(lessons, many=True).data
        for lesson, serialized in zip(lessons, data, strict=False):
            if lesson.is_free_preview:
                full = LessonSerializer(lesson).data
                serialized['video_url'] = full.get('video_url')
        return data


class CourseListSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    lessons_count = serializers.ReadOnlyField()
    students_count = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = ['id', 'slug', 'title', 'description', 'thumbnail',
                  'category', 'category_name', 'category_slug',
                  'instructor_name', 'instructor_avatar', 'instructor_url',
                  'instructor_id', 'level', 'language', 'duration_hours',
                  'access_level', 'is_free', 'price', 'is_featured',
                  'lessons_count', 'students_count']

    def get_title(self, obj):
        return _extract_field(obj.translations, 'title')

    def get_description(self, obj):
        return _extract_field(obj.translations, 'description')

    def get_instructor_name(self, obj):
        instructor = obj.instructor
        if instructor:
            name = instructor.translations.get('ar', {}).get('name') or instructor.translations.get('en', {}).get('name')
            if name:
                return {'ar': name, 'en': name}
        return _extract_field(obj.instructor_translations, 'name')

    def get_category_name(self, obj):
        if obj.category:
            return _extract_field(obj.category.translations, 'name')
        return None

    def get_category_slug(self, obj):
        return obj.category.slug if obj.category else None


class CourseDetailSerializer(CourseListSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    is_enrolled = serializers.SerializerMethodField()
    enrollment_progress = serializers.SerializerMethodField()
    is_purchased = serializers.SerializerMethodField()
    can_access = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + [
            'chapters', 'is_enrolled', 'enrollment_progress',
            'is_purchased', 'can_access',
        ]

    def get_is_enrolled(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Enrollment.objects.filter(user=request.user, course=obj).exists()
        return False

    def get_enrollment_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            enrollment = Enrollment.objects.filter(user=request.user, course=obj).first()
            if enrollment:
                return enrollment.progress
        return None

    def get_is_purchased(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CoursePurchase.objects.filter(
                user=request.user, course=obj, status=CoursePurchase.Status.PAID
            ).exists()
        return False

    def get_can_access(self, obj):
        request = self.context.get('request')
        if obj.is_free or obj.access_level == Course.AccessLevel.FREE:
            return True
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if CoursePurchase.objects.filter(
            user=request.user, course=obj, status=CoursePurchase.Status.PAID
        ).exists():
            return True
        user_level = request.user.get_subscription_level() if hasattr(request.user, 'get_subscription_level') else PLAN_LEVELS.get(request.user.subscription_plan, 0)
        return user_level >= PLAN_LEVELS.get(obj.access_level, 0)


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress = serializers.ReadOnlyField()
    total_lessons = serializers.ReadOnlyField()

    class Meta:
        model = Enrollment
        fields = ['id', 'course', 'progress', 'total_lessons', 'enrolled_at', 'completed_at']


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

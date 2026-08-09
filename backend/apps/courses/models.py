from django.conf import settings
from django.db import models
from django.utils.text import slugify


class CourseCategory(models.Model):
    """تصنيف الدورات"""
    slug = models.SlugField(unique=True, max_length=100)
    translations = models.JSONField('Translations', default=dict, blank=True)
    icon = models.CharField('Icon', max_length=10, default='📚')
    order = models.IntegerField('Order', default=0)
    is_active = models.BooleanField('Active', default=True)

    class Meta:
        verbose_name = 'Course Category'
        verbose_name_plural = 'Course Categories'
        ordering = ['order', 'slug']

    def __str__(self):
        return self.translations.get('ar', {}).get('name', self.slug)


class Course(models.Model):
    """دورة تدريبية"""

    class Level(models.TextChoices):
        BEGINNER = 'beginner', 'مبتدئ'
        INTERMEDIATE = 'intermediate', 'متوسط'
        ADVANCED = 'advanced', 'متقدم'

    class AccessLevel(models.TextChoices):
        FREE = 'free', 'مجاني'
        BASIC = 'basic', 'أساسي'
        PRO = 'pro', 'برو'
        ENTERPRISE = 'enterprise', 'مؤسسي'

    slug = models.SlugField(unique=True, max_length=200)
    translations = models.JSONField('Translations', default=dict, blank=True)
    category = models.ForeignKey(CourseCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')

    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                                   related_name='courses', verbose_name='المدرب')
    instructor_translations = models.JSONField('Instructor Translations', default=dict, blank=True)
    instructor_avatar = models.URLField('Instructor Avatar', blank=True, default='')
    instructor_url = models.URLField('Instructor Channel/URL', blank=True, default='')

    thumbnail = models.URLField('Thumbnail', blank=True, default='')
    level = models.CharField('Level', max_length=20, choices=Level.choices, default=Level.BEGINNER)
    language = models.CharField('Language', max_length=5, default='ar')
    duration_hours = models.FloatField('Duration (hours)', default=0)

    access_level = models.CharField('Access Level', max_length=20, choices=AccessLevel.choices, default=AccessLevel.FREE)
    is_free = models.BooleanField('Free', default=True)
    price = models.DecimalField('Price', max_digits=8, decimal_places=2, default=0)
    platform_fee_percent = models.DecimalField(
        'Platform Fee %', max_digits=4, decimal_places=1, default=10,
        help_text='نسبة رسوم المنصة من سعر الشراء، والباقي للمدرب',
    )
    is_published = models.BooleanField('Published', default=False)
    is_featured = models.BooleanField('Featured', default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        ordering = ['-is_featured', '-created_at']

    def __str__(self):
        return self.translations.get('ar', {}).get('title', self.slug)

    def save(self, *args, **kwargs):
        if not self.slug:
            title = self.translations.get('en', {}).get('title', '') or self.translations.get('ar', {}).get('title', '')
            self.slug = slugify(title) or 'untitled'
        super().save(*args, **kwargs)

    @property
    def lessons_count(self):
        return Lesson.objects.filter(chapter__course=self).count()

    @property
    def students_count(self):
        return self.enrollments.count()


class Chapter(models.Model):
    """فصل/قسم في الدورة"""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='chapters')
    translations = models.JSONField('Translations', default=dict, blank=True)
    order = models.IntegerField('Order', default=0)

    class Meta:
        verbose_name = 'Chapter'
        verbose_name_plural = 'Chapters'
        ordering = ['order', 'id']

    def __str__(self):
        return self.translations.get('ar', {}).get('title', f'Chapter {self.order}')


class Lesson(models.Model):
    """درس داخل فصل"""
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='lessons')
    translations = models.JSONField('Translations', default=dict, blank=True)
    video_url = models.URLField('Video URL (YouTube embed)', blank=True, default='')
    duration_minutes = models.IntegerField('Duration (minutes)', default=0)
    order = models.IntegerField('Order', default=0)
    is_free_preview = models.BooleanField('Free Preview', default=False)

    class Meta:
        verbose_name = 'Lesson'
        verbose_name_plural = 'Lessons'
        ordering = ['order', 'id']

    def __str__(self):
        return self.translations.get('ar', {}).get('title', f'Lesson {self.order}')


class Enrollment(models.Model):
    """تسجيل مستخدم في دورة"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    completed_lessons = models.ManyToManyField(Lesson, blank=True, related_name='completed_by')
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
        unique_together = ['user', 'course']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f'{self.user.email} → {self.course.slug}'

    @property
    def total_lessons(self):
        return Lesson.objects.filter(chapter__course=self.course).count()

    @property
    def progress(self):
        total = self.total_lessons
        if total == 0:
            return 0
        return round((self.completed_lessons.count() / total) * 100)


class CoursePurchase(models.Model):
    """شراء دورة لمرة واحدة — وصول مدى الحياة"""

    kind = 'course_purchase'

    class Status(models.TextChoices):
        PENDING = 'pending', 'قيد الانتظار'
        PAID = 'paid', 'مدفوع'
        REFUNDED = 'refunded', 'مسترد'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='course_purchases')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='purchases')

    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_provider = models.CharField('مزوّد الدفع', max_length=32, blank=True, default='')
    payment_session_id = models.CharField('معرّف الجلسة', max_length=255, blank=True, default='')
    payment_transaction_id = models.CharField('معرّف العملية', max_length=255, blank=True, default='')

    price_paid = models.DecimalField('المبلغ المدفوع', max_digits=10, decimal_places=2)
    currency = models.CharField('العملة', max_length=3, default='JOD')
    display_price = models.DecimalField('السعر المعروض', max_digits=10, decimal_places=2, default=0)
    display_currency = models.CharField('عملة العرض', max_length=3, default='JOD')

    purchased_at = models.DateTimeField('تاريخ الشراء', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'شراء دورة'
        verbose_name_plural = 'مشتريات الدورات'
        unique_together = ['user', 'course']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.course.slug} [{self.status}]'

    @property
    def buyer(self):
        return self.user

    @property
    def title(self):
        return self.course.translations

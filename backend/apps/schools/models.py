from django.db import models

from apps.academics.models import Grade, Subject
from apps.users.models import User


class DayOfWeek(models.IntegerChoices):
    """ISO 8601 weekday numbering: Monday=1 ... Sunday=7."""
    MONDAY = 1, 'الاثنين'
    TUESDAY = 2, 'الثلاثاء'
    WEDNESDAY = 3, 'الأربعاء'
    THURSDAY = 4, 'الخميس'
    FRIDAY = 5, 'الجمعة'
    SATURDAY = 6, 'السبت'
    SUNDAY = 7, 'الأحد'


# Default Jordanian school week: Sunday-Thursday, week starts Sunday (ISO=7).
DEFAULT_WEEK_START = DayOfWeek.SUNDAY
DEFAULT_WORKING_DAYS = [7, 1, 2, 3, 4]


def default_working_days():
    return list(DEFAULT_WORKING_DAYS)


class School(models.Model):
    name = models.CharField('اسم المدرسة', max_length=255)
    school_code = models.CharField('الرمز التعريفي للمدرسة (School Code)', max_length=50, unique=True)
    directorate = models.CharField('المديرية التابعة لها', max_length=255, blank=True)
    governorate = models.CharField('المحافظة', max_length=100, blank=True)
    region = models.CharField('الإقليم', max_length=100, blank=True)
    gender = models.CharField('جنس المؤسسة', max_length=50, blank=True)
    education_type = models.CharField('نوع التعليم', max_length=100, blank=True)
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    phone = models.CharField('رقم الهاتف', max_length=50, blank=True)
    address = models.TextField('العنوان', blank=True)
    week_start = models.IntegerField(
        'بداية الأسبوع', choices=DayOfWeek.choices, default=DEFAULT_WEEK_START,
        help_text='أول أيام الأسبوع الدراسي (ISO: 1=الاثنين ... 7=الأحد)',
    )
    working_days = models.JSONField(
        'أيام الدوام', default=default_working_days,
        help_text='أيام الدوام الدراسي كقائمة أرقام ISO (1=الاثنين ... 7=الأحد)',
    )
    manager = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_schools', verbose_name='مدير المدرسة',
    )

    class Meta:
        verbose_name = 'مدرسة'
        verbose_name_plural = 'المدارس'

    def __str__(self):
        return f"{self.name} ({self.school_code})"


class AcademicYear(models.Model):
    name = models.CharField('العام الدراسي (مثل 2025/2026)', max_length=50, unique=True)
    start_date = models.DateField('تاريخ البداية', null=True, blank=True)
    end_date = models.DateField('تاريخ النهاية', null=True, blank=True)
    is_current = models.BooleanField('العام الحالي', default=False)

    class Meta:
        verbose_name = 'عام دراسي'
        verbose_name_plural = 'الأعوام الدراسية'
        ordering = ['-name']

    def __str__(self):
        return self.name


class Section(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='sections', verbose_name='المدرسة')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='sections', verbose_name='الصف الدراسي')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='sections', verbose_name='العام الدراسي')
    name = models.CharField('اسم الشعبة (مثل أ، ب، 1)', max_length=50)
    capacity = models.PositiveIntegerField('السعة الاستيعابية', default=30)
    class_teacher = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='mentored_sections', verbose_name='مربي الصف',
    )

    class Meta:
        verbose_name = 'شعبة صفية'
        verbose_name_plural = 'الشعب الصفية'
        ordering = ['school', 'grade', 'name']
        unique_together = ['school', 'grade', 'academic_year', 'name']

    def __str__(self):
        grade_name = self.grade.translations.get('ar', {}).get('name', str(self.grade.level))
        return f"{self.school.name} - {grade_name} ({self.name}) [{self.academic_year.name}]"


class SchoolGrade(models.Model):
    """Which global grades a school offers, and how many sections per grade."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='offered_grades', verbose_name='المدرسة')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='school_offers', verbose_name='الصف الدراسي')
    section_count = models.PositiveIntegerField('عدد الشعب لكل صف', default=1)
    is_active = models.BooleanField('مفعّل', default=True)

    class Meta:
        verbose_name = 'صف مدرسي معروض'
        verbose_name_plural = 'الصفوف المعروضة في المدرسة'
        ordering = ['grade__level']
        unique_together = ['school', 'grade']

    def __str__(self):
        return f"{self.school.name} - {self.grade} (شعب: {self.section_count})"


class SchoolSubjectPeriod(models.Model):
    """Weekly periods count for each subject within an offered grade of a school."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='subject_periods', verbose_name='المدرسة')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='school_subject_periods', verbose_name='الصف الدراسي')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='school_subject_periods', verbose_name='المادة')
    weekly_periods = models.PositiveIntegerField('عدد الحصص الأسبوعية', default=1)

    class Meta:
        verbose_name = 'عدد حصص مادة في صف'
        verbose_name_plural = 'عدد حصص المواد في الصفوف'
        ordering = ['grade__level', 'id']
        unique_together = ['school', 'grade', 'subject']

    def __str__(self):
        return f"{self.grade} - {self.subject} ({self.weekly_periods} حصص)"


class SchoolTeacher(models.Model):
    """Direct link between a school and a teacher account (scope for school managers)."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers_link', verbose_name='المدرسة')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='school_links', verbose_name='المعلم')
    max_weekly_periods = models.PositiveIntegerField('النصاب (عدد الحصص الأسبوعية)', default=24)
    created_at = models.DateTimeField('تاريخ الإضافة', auto_now_add=True)

    class Meta:
        verbose_name = 'معلم في مدرسة'
        verbose_name_plural = 'المعلمون في المدارس'
        unique_together = ['school', 'teacher']

    def __str__(self):
        return f"{self.teacher.email} @ {self.school.name}"


class StudentEnrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='school_enrollments', verbose_name='الطالب')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='students', verbose_name='الشعبة الصفية')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments', verbose_name='العام الدراسي')

    class Meta:
        verbose_name = 'تسجيل طالب'
        verbose_name_plural = 'تسجيلات الطلاب'
        unique_together = ['student', 'academic_year']

    def __str__(self):
        return f"{self.student.email} -> {self.section}"


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments', verbose_name='المعلم')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='teachers', verbose_name='الشعبة الصفية')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teacher_assignments', verbose_name='المادة الدراسية')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='assignments', verbose_name='العام الدراسي')

    class Meta:
        verbose_name = 'إسناد معلم'
        verbose_name_plural = 'إسنادات المعلمين'
        unique_together = ['teacher', 'section', 'subject', 'academic_year']

    def __str__(self):
        return f"{self.teacher.email} teaches {self.subject} in {self.section}"


class SchoolAnnouncement(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements', verbose_name='الناشر')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='announcements', verbose_name='المدرسة')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='announcements', verbose_name='الشعبة (فارغ للعام)')
    title = models.CharField('عنوان التنبيه / الواجب', max_length=255)
    content = models.TextField('محتوى التنبيه / الواجب')
    is_emergency = models.BooleanField('حالة طارئة (إرسال واتساب فوري)', default=False)
    created_at = models.DateTimeField('تاريخ النشر', auto_now_add=True)

    class Meta:
        verbose_name = 'إعلان أو واجب مدرسي'
        verbose_name_plural = 'الإعلانات والواجبات المدرسية'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class FamilyLink(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='linked_children', verbose_name='ولي الأمر')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='linked_guardians', verbose_name='الطالب')
    relationship = models.CharField('صلة القرابة', max_length=50, blank=True)
    created_at = models.DateTimeField('تاريخ الربط', auto_now_add=True)

    class Meta:
        verbose_name = 'ربط ولي أمر بطالب'
        verbose_name_plural = 'روابط أولياء الأمور بالطلاب'
        unique_together = ['parent', 'student']

    def __str__(self):
        return f"{self.parent.email} -> {self.student.email}"


class AnnouncementReadReceipt(models.Model):
    announcement = models.ForeignKey(SchoolAnnouncement, on_delete=models.CASCADE, related_name='read_receipts', verbose_name='الإعلان')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcement_receipts', verbose_name='القارئ')
    read_at = models.DateTimeField('وقت القراءة', auto_now_add=True)

    class Meta:
        verbose_name = 'تأكيد قراءة إعلان'
        verbose_name_plural = 'تأكيدات قراءة الإعلانات'
        unique_together = ['announcement', 'user']

    def __str__(self):
        return f"{self.user.email} read {self.announcement.title}"


class ParentTeacherTicket(models.Model):
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_tickets', verbose_name='ولي الأمر')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_tickets', verbose_name='المعلم')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_tickets', verbose_name='الطالب')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets', verbose_name='المادة')
    title = models.CharField('عنوان الاستفسار', max_length=255)
    status = models.CharField('الحالة', max_length=20, default='open', choices=[('open', 'مفتوح'), ('in_progress', 'قيد المعالجة'), ('closed', 'مغلق')])
    messages = models.JSONField('سجل المحادثة', default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تذكرة استفسار ولي أمر'
        verbose_name_plural = 'تذاكر استفسارات أولياء الأمور'
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket: {self.title} ({self.status})"


class WhatsAppNotificationLog(models.Model):
    recipient_phone = models.CharField('رقم المستلم', max_length=50)
    message = models.TextField('نص الرسالة')
    status = models.CharField('الحالة', max_length=20, default='pending', choices=[('sent', 'تم الإرسال'), ('failed', 'فشل الإرسال')])
    error_message = models.TextField('رسالة الخطأ', blank=True)
    sent_at = models.DateTimeField('تاريخ الإرسال', auto_now_add=True)

    class Meta:
        verbose_name = 'سجل إشعارات الواتساب'
        verbose_name_plural = 'سجلات إشعارات الواتساب'
        ordering = ['-sent_at']

    def __str__(self):
        return f"WhatsApp to {self.recipient_phone} - {self.status}"


class UserAISetting(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ai_setting', verbose_name='المستخدم')
    language_complexity = models.CharField('تعقيد اللغة', max_length=50, default='simple')
    tone_preference = models.CharField('نبرة المساعد', max_length=50, default='friendly')
    voice_type = models.CharField('نوع الصوت', max_length=50, default='default')
    context_retrieval = models.BooleanField('استرجاع السياق المتقدم', default=True)

    class Meta:
        verbose_name = 'إعدادات الذكاء الاصطناعي للمستخدم'
        verbose_name_plural = 'إعدادات الذكاء الاصطناعي للمستخدمين'

    def __str__(self):
        return f"AI Settings for {self.user.email}"


class WeeklyReport(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_weekly_reports', verbose_name='الطالب')
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parent_weekly_reports', verbose_name='ولي الأمر', null=True, blank=True)
    week_start = models.DateField('بداية الأسبوع')
    summary = models.TextField('التقرير الأسبوعي الملخص')
    assignments_submitted = models.IntegerField('الواجبات المسلمة', default=0)
    attendance_rate = models.FloatField('نسبة الحضور', default=0.0)
    topics_needing_support = models.JSONField('المواضيع التي تحتاج دعم', default=list, blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'تقرير أسبوعي'
        verbose_name_plural = 'التقارير الأسبوعية'
        unique_together = ['student', 'week_start']
        ordering = ['-week_start']

    def __str__(self):
        return f"Weekly report for {self.student.email} ({self.week_start})"


class FAQ(models.Model):
    question = models.CharField('السؤال', max_length=500)
    answer = models.TextField('الإجابة')
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    is_active = models.BooleanField('نشط', default=True)
    sort_order = models.IntegerField('الترتيب', default=0)

    class Meta:
        verbose_name = 'سؤال شائع'
        verbose_name_plural = 'الأسئلة الشائعة'
        ordering = ['sort_order']

    def __str__(self):
        return self.question


class SupportRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_requests', verbose_name='المستخدم')
    subject = models.CharField('الموضوع', max_length=255)
    message = models.TextField('الرسالة')
    status = models.CharField('الحالة', max_length=20, default='open', choices=[('open', 'مفتوح'), ('in_progress', 'قيد المعالجة'), ('resolved', 'تم الحل')])
    created_at = models.DateTimeField('تاريخ الإرسال', auto_now_add=True)

    class Meta:
        verbose_name = 'طلب دعم فني'
        verbose_name_plural = 'طلبات الدعم الفني'
        ordering = ['-created_at']

    def __str__(self):
        return f"Support: {self.subject} ({self.status})"


class Attendance(models.Model):
    """سجل حضور/غياب يومي للطالب داخل شعبة، يُسجَّل من قبل المعلم أو الإدارة."""

    class Status(models.TextChoices):
        PRESENT = 'present', 'حاضر'
        ABSENT = 'absent', 'غائب'

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendances', verbose_name='الطالب')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='attendance_records', verbose_name='الشعبة')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='attendance_records', verbose_name='المدرسة')
    date = models.DateField('التاريخ', db_index=True)
    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.PRESENT)
    recorded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='recorded_attendances', verbose_name='سجّله'
    )
    notes = models.TextField('ملاحظات', blank=True)
    created_at = models.DateTimeField('تاريخ الإنشاء', auto_now_add=True)

    class Meta:
        verbose_name = 'حضور / غياب'
        verbose_name_plural = 'سجلات الحضور والغياب'
        ordering = ['-date', 'student__email']
        unique_together = [['student', 'date']]

    def __str__(self):
        return f"{self.student.email} — {self.date} ({self.get_status_display()})"


class Attachment(models.Model):
    """ملف أو صورة مرفق بشرح درس أو واجب منزلي، يرفعه المعلم أو الطالب وتتابعه الإدارة."""

    class Kind(models.TextChoices):
        LESSON = 'lesson', 'شرح درس'
        HOMEWORK = 'homework', 'واجب منزلي'
        SUBMISSION = 'submission', 'تسليم واجب'

    class ReviewStatus(models.TextChoices):
        PENDING = 'pending', 'بانتظار المتابعة'
        APPROVED = 'approved', 'مقبول'
        REJECTED = 'rejected', 'مرفوض'

    uploader = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attachments', verbose_name='الرافع')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='attachments', verbose_name='المدرسة', null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='attachments', verbose_name='الشعبة')
    kind = models.CharField('نوع المرفق', max_length=20, choices=Kind.choices, default=Kind.LESSON)
    title = models.CharField('العنوان', max_length=255, blank=True)
    description = models.TextField('الوصف', blank=True)
    file = models.FileField('الملف / الصورة', upload_to='school_attachments/%Y/%m/')
    file_name = models.CharField('اسم الملف الأصلي', max_length=255, blank=True)
    mime_type = models.CharField('نوع الملف', max_length=100, blank=True)
    file_size = models.BigIntegerField('حجم الملف (بايت)', default=0)
    review_status = models.CharField('حالة المتابعة الإدارية', max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    review_notes = models.TextField('ملاحظات الإدارة', blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_attachments', verbose_name='راجعته الإدارة')
    reviewed_at = models.DateTimeField('تاريخ المراجعة', null=True, blank=True)
    created_at = models.DateTimeField('تاريخ الرفع', auto_now_add=True)

    class Meta:
        verbose_name = 'مرفق درس / واجب'
        verbose_name_plural = 'مرفقات الدروس والواجبات'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_kind_display()} - {self.title or self.file_name}"


class Period(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='periods', verbose_name='المدرسة')
    name = models.CharField('اسم الحصة (مثل الحصة الأولى)', max_length=100)
    period_number = models.IntegerField('رقم الحصة', default=1)
    start_time = models.TimeField('وقت البداية')
    end_time = models.TimeField('وقت النهاية')
    is_break = models.BooleanField('استراحة / فسحة', default=False)
    is_active = models.BooleanField('مفعّلة', default=True)
    generation = models.PositiveIntegerField('رقم الجيل (إصدار الجدول)', null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='created_periods', verbose_name='أنشأها',
    )
    archived_at = models.DateTimeField('تاريخ الأرشفة', null=True, blank=True)
    archived_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='archived_periods', verbose_name='أرشفها',
    )

    class Meta:
        verbose_name = 'حصة زمنية'
        verbose_name_plural = 'الحصص الزمنية'
        ordering = ['school', 'period_number']
        constraints = [
            models.UniqueConstraint(
                fields=['school', 'period_number'],
                condition=models.Q(is_active=True),
                name='unique_active_period_per_school',
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.start_time} - {self.end_time})"


class Room(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='rooms', verbose_name='المدرسة')
    name = models.CharField('اسم القاعة / المختبر', max_length=150)
    code = models.CharField('رمز القاعة', max_length=50, blank=True)
    capacity = models.IntegerField('السعة', default=30)
    room_type = models.CharField('نوع القاعة', max_length=50, default='classroom', choices=[('classroom', 'صف دراسي'), ('lab', 'مختبر علمي'), ('computer_lab', 'مختبر حاسوب'), ('hall', 'قاعة محاضرات / نشاط')])

    class Meta:
        verbose_name = 'قاعة / مختبر'
        verbose_name_plural = 'القاعات والمختبرات'
        ordering = ['school', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"


class TimetableSlot(models.Model):
    day_of_week = models.IntegerField('اليوم', choices=DayOfWeek.choices)

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='timetable_slots', verbose_name='المدرسة')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='timetable_slots', verbose_name='العام الدراسي')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='timetable_slots', verbose_name='الشعبة الصفية')
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name='slots', verbose_name='الحصة الزمنية')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='timetable_slots', verbose_name='المادة الدراسية')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timetable_slots', verbose_name='المعلم')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='timetable_slots', verbose_name='القاعة / المختبر')

    class Meta:
        verbose_name = 'خانة جدول دراسي'
        verbose_name_plural = 'خانات الجداول الدراسية'
        ordering = ['section', 'day_of_week', 'period__period_number']
        unique_together = [['section', 'day_of_week', 'period']]

    def __str__(self):
        day_display = self.get_day_of_week_display()
        return f"{self.section} - {day_display} ({self.period.name}): {self.subject} with {self.teacher.email}"

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError

        # 1. Section conflict check
        section_conflict = TimetableSlot.objects.filter(
            section=self.section,
            academic_year=self.academic_year,
            day_of_week=self.day_of_week,
            period=self.period
        ).exclude(pk=self.pk).exists()
        if section_conflict:
            raise ValidationError('الشعبة الصفية لديه حصة مسجلة بالفعل في هذا الوقت.')

        # 2. Teacher conflict check
        teacher_conflict = TimetableSlot.objects.filter(
            teacher=self.teacher,
            academic_year=self.academic_year,
            day_of_week=self.day_of_week,
            period=self.period
        ).exclude(pk=self.pk).exists()
        if teacher_conflict:
            raise ValidationError('المعلم مرتبط بحصة أخرى في نفس هذا الوقت لشعبة أخرى.')

        # 3. Room conflict check
        if self.room:
            room_conflict = TimetableSlot.objects.filter(
                room=self.room,
                academic_year=self.academic_year,
                day_of_week=self.day_of_week,
                period=self.period
            ).exclude(pk=self.pk).exists()
            if room_conflict:
                raise ValidationError('القاعة / المختبر محجوزة بالفعل في نفس هذا الوقت.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class SchoolFee(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='fees', verbose_name='المدرسة')
    title = models.CharField('عنوان الرسوم', max_length=255)
    amount = models.DecimalField('المبلغ', max_digits=10, decimal_places=2)
    grade = models.ForeignKey(SchoolGrade, on_delete=models.SET_NULL, null=True, blank=True, related_name='fees', verbose_name='الصف الدراسي')
    due_date = models.DateField('تاريخ الاستحقاق', null=True, blank=True)
    description = models.TextField('الوصف', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'رسوم مدرسية'
        verbose_name_plural = 'الرسوم المدرسية'

    def __str__(self):
        return f"{self.title} ({self.amount})"


class StudentFeeAssignment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'غير مسدد'
        PARTIAL = 'partial', 'مسدد جزئياً'
        PAID = 'paid', 'مسدد بالكامل'

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fee_assignments', verbose_name='الطالب')
    fee = models.ForeignKey(SchoolFee, on_delete=models.CASCADE, related_name='assignments', verbose_name='الرسوم')
    amount_due = models.DecimalField('المبلغ المستحق', max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField('المبلغ المدفوع', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'ذمة مالية للطالب'
        verbose_name_plural = 'الذمم المالية للطلاب'

    def __str__(self):
        return f"{self.student} - {self.fee} ({self.status})"


class SchoolBus(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='buses', verbose_name='المدرسة')
    bus_number = models.CharField('رقم الحافلة', max_length=50)
    driver_name = models.CharField('اسم السائق', max_length=255)
    driver_phone = models.CharField('هاتف السائق', max_length=50, blank=True)
    capacity = models.IntegerField('السعة الاستيعابية', default=30)

    class Meta:
        verbose_name = 'حافلة مدرسية'
        verbose_name_plural = 'الحافلات المدرسية'

    def __str__(self):
        return f"حافلة رقم {self.bus_number} - {self.driver_name}"


class BusRoute(models.Model):
    bus = models.ForeignKey(SchoolBus, on_delete=models.CASCADE, related_name='routes', verbose_name='الحافلة')
    route_name = models.CharField('اسم الخط', max_length=255)
    morning_time = models.TimeField('وقت التحرك الصباحي', null=True, blank=True)
    evening_time = models.TimeField('وقت العودة المسائي', null=True, blank=True)

    class Meta:
        verbose_name = 'خط سير حافلة'
        verbose_name_plural = 'خطوط سير الحافلات'

    def __str__(self):
        return f"{self.route_name} ({self.bus})"


class StudentBusAssignment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bus_assignments', verbose_name='الطالب')
    route = models.ForeignKey(BusRoute, on_delete=models.CASCADE, related_name='students', verbose_name='خط السير')
    pickup_point = models.CharField('نقطة التجمع / الانتظار', max_length=255)

    class Meta:
        verbose_name = 'تخصيص حافلة لطالب'
        verbose_name_plural = 'تخصيص الحافلات للطلاب'

    def __str__(self):
        return f"{self.student} - {self.route}"


class Book(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='books', verbose_name='المدرسة')
    title = models.CharField('عنوان الكتاب', max_length=255)
    author = models.CharField('المؤلف', max_length=255, blank=True)
    isbn = models.CharField('الرقم التسلسلي ISBN', max_length=50, blank=True)
    category = models.CharField('التصنيف', max_length=100, blank=True)
    total_copies = models.PositiveIntegerField('إجمالي النسخ', default=1)
    available_copies = models.PositiveIntegerField('النسخ المتاحة', default=1)

    class Meta:
        verbose_name = 'كتاب مدرسي'
        verbose_name_plural = 'كتب المكتبة المدرسية'

    def __str__(self):
        return f"{self.title} ({self.author})"


class LibraryLending(models.Model):
    class Status(models.TextChoices):
        BORROWED = 'borrowed', 'مستعار'
        RETURNED = 'returned', 'تم الإرجاع'
        OVERDUE = 'overdue', 'متأخر'

    class BorrowerRole(models.TextChoices):
        STUDENT = 'student', 'طالب'
        TEACHER = 'teacher', 'معلم'
        PARENT = 'parent', 'ولي أمر'
        STAFF = 'staff', 'موظف'
        OTHER = 'other', 'أخرى'

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='lendings', verbose_name='الكتاب')
    borrower = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='book_lendings', verbose_name='المستعير (حساب مرتبط)',
        help_text='الحساب المرتبط بالمستعير إن وُجد (طالب/معلم/ولي أمر).',
    )
    borrower_role = models.CharField(
        'نوع المستعير', max_length=20, choices=BorrowerRole.choices, default=BorrowerRole.STUDENT,
    )
    borrower_name = models.CharField(
        'اسم المستعير (للمتابعة)', max_length=255, blank=True,
        help_text='اسم المستعير الكامل لمتابعة العهدة والاستعارة.',
    )
    borrow_date = models.DateField('تاريخ الاستعارة', auto_now_add=True)
    due_date = models.DateField('تاريخ الاستحقاق', null=True, blank=True)
    return_date = models.DateField('تاريخ الإرجاع الفعلي', null=True, blank=True)
    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.BORROWED)

    class Meta:
        verbose_name = 'عملية إعارة كتاب'
        verbose_name_plural = 'عمليات إعارة الكتب'

    def __str__(self):
        return f"{self.book} -> {self.borrower_name or self.borrower} ({self.status})"


class GradeCategory(models.Model):
    """نوع التقييم: امتحان، واجب، مشروع، شفهي، إلخ."""
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='grade_categories', verbose_name='المدرسة')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='grade_categories', verbose_name='المادة')
    name = models.CharField('اسم التقييم', max_length=255)
    weight = models.PositiveIntegerField('النسبة المئوية للوزن (%)', default=10,
        help_text='الوزن النسبي لهذا التقييم من إجمالي الدرجات (1-100)')
    max_score = models.PositiveIntegerField('الدرجة النهائية', default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تصنيف درجات'
        verbose_name_plural = 'تصنيفات الدرجات'
        ordering = ['subject', 'name']

    def __str__(self):
        return f"{self.name} ({self.subject} - {self.weight}%)"


class GradeEntry(models.Model):
    """درجة الطالب في تقييم معين."""
    category = models.ForeignKey(GradeCategory, on_delete=models.CASCADE, related_name='entries', verbose_name='التصنيف')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='grade_entries', verbose_name='الطالب')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='grade_entries', verbose_name='الشعبة')
    score = models.DecimalField('الدرجة المحصل عليها', max_digits=8, decimal_places=2)
    notes = models.TextField('ملاحظات المعلم', blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='graded_entries', verbose_name='قيّمها')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'درجة طالب'
        verbose_name_plural = 'درجات الطلاب'
        unique_together = ['category', 'student']
        ordering = ['section', 'student__email']

    def __str__(self):
        return f"{self.student.email} - {self.category.name}: {self.score}/{self.category.max_score}"

    @property
    def percentage(self):
        if self.category.max_score == 0:
            return 0
        return round(float(self.score) / float(self.category.max_score) * 100, 1)


class Assignment(models.Model):
    """واجب منزلي أو مشروع يُكلّف به المعلم للطلاب."""
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='assignments', verbose_name='الشعبة')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments', verbose_name='المادة')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_assignments', verbose_name='المعلم')
    title = models.CharField('عنوان الواجب', max_length=255)
    description = models.TextField('وصف الواجب', blank=True)
    due_date = models.DateTimeField('موعد التسليم', null=True, blank=True)
    max_score = models.PositiveIntegerField('الدرجة النهائية', default=100)
    attachment = models.FileField('مرفق الواجب', upload_to='assignments/%Y/%m/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'واجب منزلي'
        verbose_name_plural = 'الواجبات المنزلية'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.section})"


class AssignmentSubmission(models.Model):
    """حل الطالب للواجب."""

    class Status(models.TextChoices):
        SUBMITTED = 'submitted', 'تم التسليم'
        GRADED = 'graded', 'تم التقييم'
        RETURNED = 'returned', 'مرجع للمراجعة'

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions', verbose_name='الواجب')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions', verbose_name='الطالب')
    file = models.FileField('ملف الحل', upload_to='submissions/%Y/%m/', blank=True)
    notes = models.TextField('ملاحظات الطالب', blank=True)
    score = models.DecimalField('الدرجة', max_digits=8, decimal_places=2, null=True, blank=True)
    feedback = models.TextField('تعليق المعلم', blank=True)
    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    submitted_at = models.DateTimeField('تاريخ التسليم', auto_now_add=True)
    graded_at = models.DateTimeField('تاريخ التقييم', null=True, blank=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='graded_submissions', verbose_name='قيّمها')

    class Meta:
        verbose_name = 'تسليم واجب'
        verbose_name_plural = 'تسليمات الواجبات'
        unique_together = ['assignment', 'student']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.email} - {self.assignment.title} ({self.status})"

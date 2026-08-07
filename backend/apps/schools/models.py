from django.db import models

from apps.academics.models import Grade, Subject
from apps.users.models import User


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

    class Meta:
        verbose_name = 'شعبة صفية'
        verbose_name_plural = 'الشعب الصفية'
        ordering = ['school', 'grade', 'name']
        unique_together = ['school', 'grade', 'academic_year', 'name']

    def __str__(self):
        grade_name = self.grade.translations.get('ar', {}).get('name', str(self.grade.level))
        return f"{self.school.name} - {grade_name} ({self.name}) [{self.academic_year.name}]"


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

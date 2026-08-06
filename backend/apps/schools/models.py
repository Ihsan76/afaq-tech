from django.db import models

from apps.academics.models import Grade, Subject
from apps.users.models import User


class School(models.Model):
    name = models.CharField('اسم المدرسة', max_length=255)
    school_code = models.CharField('الرمز التعريفي للمدرسة (School Code)', max_length=50, unique=True)
    directorate = models.CharField('المديرية التابعة لها', max_length=255, blank=True)
    translations = models.JSONField('الترجمات', default=dict, blank=True)
    phone = models.CharField('رقم الهاتف', max_length=50, blank=True)
    address = models.TextField('العنوان', blank=True)

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

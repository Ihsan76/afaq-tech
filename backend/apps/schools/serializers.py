from rest_framework import serializers

from .models import (
    FAQ,
    AcademicYear,
    AnnouncementReadReceipt,
    Attachment,
    Attendance,
    FamilyLink,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    SupportRequest,
    TeacherAssignment,
    WeeklyReport,
)


class SchoolSerializer(serializers.ModelSerializer):
    manager_email = serializers.CharField(source='manager.email', read_only=True, default='')
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = '__all__'

    def get_manager_name(self, obj):
        if not obj.manager:
            return ''
        return obj.manager.translations.get('ar', {}).get('name') or obj.manager.email


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    grade_name = serializers.SerializerMethodField()
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Section
        fields = '__all__'

    def get_grade_name(self, obj):
        return obj.grade.translations.get('ar', {}).get('name', str(obj.grade.level))


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = '__all__'


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    subject_name = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = '__all__'

    def get_subject_name(self, obj):
        return obj.subject.translations.get('ar', {}).get('name', '')


class SchoolAnnouncementSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source='author.email', read_only=True)
    read_count = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = SchoolAnnouncement
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

    def get_read_count(self, obj):
        return obj.read_receipts.count()

    def get_is_read(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return False
        return obj.read_receipts.filter(user=user).exists()


class ParentTeacherTicketSerializer(serializers.ModelSerializer):
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = ParentTeacherTicket
        fields = '__all__'
        read_only_fields = ['parent', 'created_at']


class FamilyLinkSerializer(serializers.ModelSerializer):
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    relationship = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = FamilyLink
        fields = '__all__'
        read_only_fields = ['parent', 'created_at']

    def get_student_name(self, obj):
        return obj.student.translations.get('ar', {}).get('name', obj.student.email)


class AnnouncementReadReceiptSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AnnouncementReadReceipt
        fields = '__all__'
        read_only_fields = ['user', 'read_at']


class WeeklyReportSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyReport
        fields = '__all__'

    def get_student_name(self, obj):
        return obj.student.translations.get('ar', {}).get('name', obj.student.email)


class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = '__all__'
        read_only_fields = ['id']


class SupportRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = SupportRequest
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class AttendanceSerializer(serializers.ModelSerializer):
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_name = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    recorded_by_email = serializers.CharField(source='recorded_by.email', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['recorded_by', 'created_at']

    def get_student_name(self, obj):
        return obj.student.translations.get('ar', {}).get('name', obj.student.email)


class AttachmentSerializer(serializers.ModelSerializer):
    uploader_email = serializers.CharField(source='uploader.email', read_only=True)
    uploader_name = serializers.SerializerMethodField()
    section_name = serializers.CharField(source='section.name', read_only=True)
    file_url = serializers.SerializerMethodField()
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    review_status_display = serializers.CharField(source='get_review_status_display', read_only=True)

    class Meta:
        model = Attachment
        fields = '__all__'
        read_only_fields = ['uploader', 'file_name', 'mime_type', 'file_size', 'reviewed_by', 'reviewed_at', 'created_at']

    def get_uploader_name(self, obj):
        return obj.uploader.translations.get('ar', {}).get('name', obj.uploader.email)

    def get_file_url(self, obj):
        request = self.context.get('request')
        url = obj.file.url if obj.file else ''
        return request.build_absolute_uri(url) if request and url else url

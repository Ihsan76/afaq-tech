from rest_framework import serializers

from .models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
)


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


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

    class Meta:
        model = SchoolAnnouncement
        fields = '__all__'
        read_only_fields = ['author', 'created_at']


class ParentTeacherTicketSerializer(serializers.ModelSerializer):
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    teacher_email = serializers.CharField(source='teacher.email', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = ParentTeacherTicket
        fields = '__all__'
        read_only_fields = ['parent', 'created_at']

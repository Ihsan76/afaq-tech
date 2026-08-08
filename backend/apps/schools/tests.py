import io

import openpyxl
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.academics.models import Grade, Subject
from apps.schools.models import (
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
    WhatsAppNotificationLog,
)

User = get_user_model()

TEST_PASSWORD = 'Afaq#Secure2026!'

def make_user(email, role, name_ar, national_id=None, phone='', **extra):
    """Creates a test user with a policy-compliant password and full user info."""
    fields = {
        'role': role,
        'translations': {'ar': {'name': name_ar}},
        'is_verified': True,
        'phone': phone,
    }
    if national_id is not None:
        fields['national_id'] = national_id
    fields.update(extra)
    return User.objects.create_user(email=email, password=TEST_PASSWORD, **fields)


class SchoolsAPITestCase(APITestCase):
    def setUp(self):
        self.admin = make_user('admin@test.com', 'admin', 'مدير الاختبار')
        self.student = make_user('student@test.com', 'student', 'طالب الاختبار', national_id='1234567890', phone='0771000001')
        self.student2 = make_user('student2@test.com', 'student', 'طالب الاختبار الثاني', national_id='1234567891', phone='0771000002')
        self.teacher = make_user('teacher@test.com', 'teacher', 'معلم الاختبار', phone='0771000003')

        self.grade = Grade.objects.create(level=3, translations={'ar': {'name': 'الصف الثالث'}})
        self.subject = Subject.objects.create(translations={'ar': {'name': 'الرياضيات'}})
        self.year = AcademicYear.objects.create(name='2025/2026', is_current=True)

        self.school_a = School.objects.create(name='مدرسة أ', school_code='A1')
        self.school_b = School.objects.create(name='مدرسة ب', school_code='B1')

        self.section_a = Section.objects.create(
            school=self.school_a, grade=self.grade, academic_year=self.year, name='أ'
        )
        self.section_b = Section.objects.create(
            school=self.school_b, grade=self.grade, academic_year=self.year, name='ب'
        )

        StudentEnrollment.objects.create(student=self.student, section=self.section_a, academic_year=self.year)
        StudentEnrollment.objects.create(student=self.student2, section=self.section_b, academic_year=self.year)
        TeacherAssignment.objects.create(
            teacher=self.teacher, section=self.section_a, subject=self.subject, academic_year=self.year
        )

        self.ann_section = SchoolAnnouncement.objects.create(
            author=self.teacher, school=self.school_a, section=self.section_a,
            title='واجب رياضيات', content='حل صفحة 20'
        )
        self.ann_emergency = SchoolAnnouncement.objects.create(
            author=self.admin, school=self.school_b, section=self.section_b,
            title='حالة طارئة', content='إغلاق مبكر', is_emergency=True
        )

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def results(self, res):
        return res.data.get('results', res.data)

    def test_student_sees_only_own_section_announcements(self):
        self.auth(self.student)
        res = self.client.get('/api/v1/schools/announcements/')
        self.assertEqual(res.status_code, 200)
        titles = [a['title'] for a in self.results(res)]
        self.assertIn('واجب رياضيات', titles)
        self.assertNotIn('حالة طارئة', titles)

    def test_teacher_sees_only_assigned_sections(self):
        self.auth(self.teacher)
        res = self.client.get('/api/v1/schools/sections/')
        self.assertEqual(res.status_code, 200)
        ids = [s['id'] for s in self.results(res)]
        self.assertIn(self.section_a.id, ids)
        self.assertNotIn(self.section_b.id, ids)

    def test_student_cannot_write_schools(self):
        self.auth(self.student)
        res = self.client.post('/api/v1/schools/schools/', {
            'name': 'مدرسة مخترقة', 'school_code': 'HACK'
        })
        self.assertEqual(res.status_code, 403)

    def test_teacher_can_create_announcement(self):
        self.auth(self.teacher)
        res = self.client.post('/api/v1/schools/announcements/', {
            'school': self.school_a.id,
            'section': self.section_a.id,
            'title': 'إعلان جديد', 'content': 'اختبار'
        })
        self.assertEqual(res.status_code, 201)

    def test_teacher_cannot_force_emergency(self):
        self.auth(self.teacher)
        res = self.client.post('/api/v1/schools/announcements/', {
            'school': self.school_a.id,
            'section': self.section_a.id,
            'title': 'محاولة طارئة', 'content': 'اختبار',
            'is_emergency': True
        })
        self.assertEqual(res.status_code, 201)
        self.assertFalse(res.data['is_emergency'])

    def test_admin_can_force_emergency(self):
        self.auth(self.admin)
        res = self.client.post('/api/v1/schools/announcements/', {
            'school': self.school_b.id,
            'section': self.section_b.id,
            'title': 'تنبيه طارئ', 'content': 'اختبار',
            'is_emergency': True
        })
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['is_emergency'])

    def test_tickets_scoped_to_participants(self):
        ParentTeacherTicket.objects.create(
            parent=self.student, teacher=self.teacher, student=self.student,
            title='استفسار عن الواجب'
        )
        ParentTeacherTicket.objects.create(
            parent=self.student2, teacher=self.teacher, student=self.student2,
            title='استفسار آخر'
        )
        self.auth(self.student)
        res = self.client.get('/api/v1/schools/tickets/')
        titles = [t['title'] for t in self.results(res)]
        self.assertIn('استفسار عن الواجب', titles)
        self.assertNotIn('استفسار آخر', titles)

    def test_my_context_student(self):
        self.auth(self.student)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['role'], 'student')
        self.assertEqual(len(res.data['sections']), 1)
        self.assertEqual(res.data['sections'][0]['id'], self.section_a.id)
        self.assertEqual(len(res.data['announcements']), 1)
        self.assertEqual(len(res.data['tickets']), 0)

    def test_my_context_teacher(self):
        self.auth(self.teacher)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['sections']), 1)
        self.assertEqual(len(res.data['announcements']), 1)

    def test_my_context_admin_sees_all(self):
        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['sections']), 2)
        self.assertEqual(len(res.data['announcements']), 2)

    def test_ticket_reply_forbidden_for_outsider(self):
        ticket = ParentTeacherTicket.objects.create(
            parent=self.student, teacher=self.teacher, student=self.student,
            title='استفسار'
        )
        self.auth(self.student2)
        res = self.client.post(f'/api/v1/schools/tickets/{ticket.id}/add_message/', {
            'message': 'تدخل خارجي'
        })
        self.assertEqual(res.status_code, 404)


class SchoolsAdvancedFeaturesTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user('admin@test.com', 'admin', 'مدير الاختبار')
        self.student = make_user('student@test.com', 'student', 'طالب الاختبار', national_id='9876543210', phone='0771000001')
        self.parent = make_user('parent@test.com', 'parent', 'ولي أمر الاختبار', phone='0771000002')
        self.teacher = make_user('teacher@test.com', 'teacher', 'معلم الاختبار', phone='0771000003')

        self.grade3 = Grade.objects.create(level=3, translations={'ar': {'name': 'الصف الثالث'}})
        self.grade4 = Grade.objects.create(level=4, translations={'ar': {'name': 'الصف الرابع'}})
        self.subject = Subject.objects.create(translations={'ar': {'name': 'الرياضيات'}})
        self.year_2025 = AcademicYear.objects.create(name='2025/2026', is_current=True)
        self.year_2026 = AcademicYear.objects.create(name='2026/2027', is_current=False)

        self.school = School.objects.create(name='مدرسة أ', school_code='A1')
        self.section3 = Section.objects.create(school=self.school, grade=self.grade3, academic_year=self.year_2025, name='أ')
        self.section4 = Section.objects.create(school=self.school, grade=self.grade4, academic_year=self.year_2026, name='أ')

        StudentEnrollment.objects.create(student=self.student, section=self.section3, academic_year=self.year_2025)
        TeacherAssignment.objects.create(teacher=self.teacher, section=self.section3, subject=self.subject, academic_year=self.year_2025)

        self.announcement = SchoolAnnouncement.objects.create(
            author=self.teacher, school=self.school, section=self.section3,
            title='واجب أسبوعي', content='حل التمارين'
        )

        FamilyLink.objects.create(parent=self.parent, student=self.student, relationship='والد')

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def test_family_link_listed_for_parent(self):
        self.auth(self.parent)
        res = self.client.get('/api/v1/schools/family-links/')
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student_email'], 'student@test.com')

    def test_family_link_creation_sets_parent(self):
        other = make_user('other@test.com', 'student', 'طالب آخر', national_id='5550001112')
        self.auth(self.parent)
        res = self.client.post('/api/v1/schools/family-links/', {'student': other.id})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['parent'], self.parent.id)

    def test_family_link_duplicate_rejected(self):
        self.auth(self.parent)
        res = self.client.post('/api/v1/schools/family-links/', {'student': self.student.id})
        self.assertEqual(res.status_code, 400)

    def test_family_link_cannot_link_non_student(self):
        self.auth(self.parent)
        res = self.client.post('/api/v1/schools/family-links/', {'student': self.teacher.id})
        self.assertEqual(res.status_code, 400)

    def test_parent_context_has_children_and_announcements(self):
        self.auth(self.parent)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['children']), 1)
        self.assertEqual(res.data['children'][0]['email'], 'student@test.com')
        self.assertEqual(len(res.data['family_links']), 1)
        self.assertEqual(len(res.data['announcements']), 1)

    def test_acknowledge_announcement(self):
        self.auth(self.student)
        res = self.client.post(f'/api/v1/schools/announcements/{self.announcement.id}/acknowledge/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['read_count'], 1)
        receipt = AnnouncementReadReceipt.objects.get(announcement=self.announcement, user=self.student)
        self.assertIsNotNone(receipt)

    def test_announcement_serializer_exposes_is_read(self):
        self.auth(self.student)
        res = self.client.get(f'/api/v1/schools/announcements/{self.announcement.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data['is_read'])
        self.client.post(f'/api/v1/schools/announcements/{self.announcement.id}/acknowledge/')
        res = self.client.get(f'/api/v1/schools/announcements/{self.announcement.id}/')
        self.assertTrue(res.data['is_read'])
        self.assertEqual(res.data['read_count'], 1)

    def test_promote_rolls_students_to_next_grade(self):
        self.auth(self.admin)
        res = self.client.post(f'/api/v1/schools/academic-years/{self.year_2025.id}/promote/', {
            'target_year_id': self.year_2026.id,
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['promoted']), 1)
        new_enrollment = StudentEnrollment.objects.get(student=self.student, academic_year=self.year_2026)
        self.assertEqual(new_enrollment.section.grade, self.grade4)
        # archive preserved
        self.assertTrue(StudentEnrollment.objects.filter(student=self.student, academic_year=self.year_2025).exists())
        # year switching
        self.year_2025.refresh_from_db()
        self.year_2026.refresh_from_db()
        self.assertFalse(self.year_2025.is_current)
        self.assertTrue(self.year_2026.is_current)

    def test_transfer_student_to_other_section(self):
        self.auth(self.admin)
        other_section = Section.objects.create(school=self.school, grade=self.grade3, academic_year=self.year_2025, name='ب')
        res = self.client.post(f'/api/v1/schools/enrollments/{StudentEnrollment.objects.get(student=self.student).id}/transfer/', {
            'target_section_id': other_section.id,
        })
        self.assertEqual(res.status_code, 200)
        en = StudentEnrollment.objects.get(student=self.student, academic_year=self.year_2025)
        self.assertEqual(en.section, other_section)

    def test_transfer_by_code(self):
        self.auth(self.admin)
        self.student.national_id = '987654321'
        self.student.save()
        other_section = Section.objects.create(school=self.school, grade=self.grade3, academic_year=self.year_2025, name='ج')
        res = self.client.post('/api/v1/schools/enrollments/transfer_by_code/', {
            'national_id': '987654321',
            'target_section_id': other_section.id,
        })
        self.assertEqual(res.status_code, 200)
        en = StudentEnrollment.objects.get(student=self.student, academic_year=self.year_2025)
        self.assertEqual(en.section, other_section)

    def test_weekly_summary_for_parent(self):
        self.auth(self.parent)
        res = self.client.get('/api/v1/schools/weekly-summary/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['reports']), 1)
        report = res.data['reports'][0]
        self.assertEqual(report['student_email'], 'student@test.com')
        self.assertEqual(report['assignments_submitted'], 1)
        self.assertTrue(WeeklyReport.objects.filter(student=self.student).exists())

    def test_weekly_summary_for_student(self):
        self.auth(self.student)
        res = self.client.get('/api/v1/schools/weekly-summary/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['reports']), 1)

    def test_faq_list_public(self):
        FAQ.objects.create(question='كيف أسجل دخولي؟', answer='من صفحة تسجيل الدخول', sort_order=1)
        res = self.client.get('/api/v1/schools/faqs/')
        self.assertEqual(res.status_code, 200)
        data = res.data.get('results', res.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['question'], 'كيف أسجل دخولي؟')

    def test_support_request_creation(self):
        self.auth(self.student)
        res = self.client.post('/api/v1/schools/support/email/', {
            'subject': 'مشكلة في تسجيل الدخول',
            'message': 'لا أستطيع تسجيل الدخول لحسابي',
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(SupportRequest.objects.count(), 1)
        self.assertEqual(SupportRequest.objects.first().user, self.student)

    def test_bulk_import_students(self):
        self.auth(self.admin)
        csv_content = (
            "email,name,national_id,phone,parent_email,school_code,grade_level,section_name,academic_year\r\n"
            "newstudent@test.com,طالب جديد,111222333,0777000000,parent2@test.com,A1,3,أ,2025/2026\r\n"
        ).encode()
        uploaded = SimpleUploadedFile('students.csv', csv_content, content_type='text/csv')
        res = self.client.post('/api/v1/schools/bulk/import/', {'kind': 'students', 'file': uploaded})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created'], 1)
        new_student = User.objects.get(email='newstudent@test.com')
        self.assertEqual(new_student.role, 'student')
        self.assertEqual(new_student.national_id, '111222333')
        self.assertTrue(StudentEnrollment.objects.filter(student=new_student).exists())
        parent2 = User.objects.get(email='parent2@test.com')
        self.assertEqual(parent2.role, 'parent')
        self.assertTrue(FamilyLink.objects.filter(parent=parent2, student=new_student).exists())

    def test_bulk_export_students(self):
        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/bulk/export/?kind=students')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('student@test.com', content)
        self.assertIn('A1', content)

    def test_bulk_import_schools_from_xlsx(self):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['رمز المؤسسة', 'اسم المؤسسة', 'المديرية', 'المحافظة', 'الإقليم', 'جنس المؤسس', 'نوع التعليم', 'العنوان'])
        ws.append(['990001', 'مدرسة الاستيراد التجريبية', 'قصبة عمان', 'العاصمة عمان', 'الوسط', 'مختلطة', 'المرحلة الأساسية', 'حي الرابية'])
        ws.append(['990002', 'مدرسة الاستيراد الثانوية', 'اربد الأولى', 'اربد', 'الشمال', 'اناث', 'المرحلة الثانوية', 'وسط البلد'])
        buffer = io.BytesIO()
        wb.save(buffer)
        uploaded = SimpleUploadedFile('schools.xlsx', buffer.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

        self.auth(self.admin)
        res = self.client.post('/api/v1/schools/bulk/import/', {'kind': 'schools', 'file': uploaded})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created'], 2)
        school = School.objects.get(school_code='990001')
        self.assertEqual(school.name, 'مدرسة الاستيراد التجريبية')
        self.assertEqual(school.governorate, 'العاصمة عمان')
        self.assertEqual(school.region, 'الوسط')
        self.assertEqual(school.gender, 'مختلطة')
        self.assertEqual(school.education_type, 'المرحلة الأساسية')
        self.assertEqual(school.translations['ar']['name'], 'مدرسة الاستيراد التجريبية')

    def test_bulk_import_schools_from_csv(self):
        csv_content = (
            "school_code,name,directorate,governorate\r\n"
            "990003,مدرسة من ملف نصي,معان,معان\r\n"
        ).encode()
        uploaded = SimpleUploadedFile('schools.csv', csv_content, content_type='text/csv')
        self.auth(self.admin)
        res = self.client.post('/api/v1/schools/bulk/import/', {'kind': 'schools', 'file': uploaded})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created'], 1)
        school = School.objects.get(school_code='990003')
        self.assertEqual(school.governorate, 'معان')

    def test_bulk_import_schools_skips_missing_code(self):
        csv_content = (
            "school_code,name\r\n"
            ",مدرسة بدون رمز\r\n"
        ).encode()
        uploaded = SimpleUploadedFile('schools.csv', csv_content, content_type='text/csv')
        self.auth(self.admin)
        res = self.client.post('/api/v1/schools/bulk/import/', {'kind': 'schools', 'file': uploaded})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['errors']), 1)
        self.assertEqual(School.objects.filter(name='مدرسة بدون رمز').count(), 0)

    def test_bulk_export_schools(self):
        School.objects.create(name='مدرسة التصدير', school_code='990100', governorate='الزرقاء')
        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/bulk/export/?kind=schools')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text/csv', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('990100', content)
        self.assertIn('الزرقاء', content)

    def test_voice_transcribe_mock_fallback(self):
        self.auth(self.student)
        from django.core.files.uploadedfile import SimpleUploadedFile
        audio = SimpleUploadedFile('a.webm', b'\x1aE\xdf\xa3fakeaudio', content_type='audio/webm')
        res = self.client.post('/api/v1/schools/voice/transcribe/', {'audio': audio}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertIn('text', res.data)
        self.assertTrue(res.data['text'])

    def test_teacher_uploads_lesson_attachment(self):
        self.auth(self.teacher)
        file = SimpleUploadedFile('lesson.pdf', b'%PDF-1.4 lesson content', content_type='application/pdf')
        res = self.client.post('/api/v1/schools/attachments/', {
            'kind': 'lesson', 'title': 'شرح الكسور', 'description': 'ملف شرح',
            'section': self.section3.id, 'file': file,
        }, format='multipart')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['uploader'], self.teacher.id)
        self.assertEqual(res.data['uploader_name'], 'معلم الاختبار')
        self.assertEqual(res.data['kind'], 'lesson')
        self.assertEqual(res.data['review_status'], 'pending')
        self.assertEqual(res.data['file_name'], 'lesson.pdf')
        self.assertTrue(res.data['file_url'])

    def test_student_uploads_homework_submission(self):
        self.auth(self.student)
        file = SimpleUploadedFile('homework.jpg', b'\xff\xd8\xff\xe0 fake image', content_type='image/jpeg')
        res = self.client.post('/api/v1/schools/attachments/', {
            'kind': 'submission', 'title': 'حل التمارين', 'file': file,
        }, format='multipart')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['kind'], 'submission')
        self.assertEqual(res.data['uploader_name'], 'طالب الاختبار')

    def test_upload_requires_file(self):
        self.auth(self.teacher)
        res = self.client.post('/api/v1/schools/attachments/', {'kind': 'lesson'})
        self.assertEqual(res.status_code, 400)

    def test_student_cannot_upload_to_unrelated_section(self):
        self.auth(self.student)
        file = SimpleUploadedFile('x.png', b'png', content_type='image/png')
        other_section = Section.objects.create(school=self.school, grade=self.grade3, academic_year=self.year_2025, name='ب')
        res = self.client.post('/api/v1/schools/attachments/', {
            'kind': 'homework', 'section': other_section.id, 'file': file,
        }, format='multipart')
        self.assertEqual(res.status_code, 400)

    def test_admin_can_review_attachment(self):
        self.auth(self.student)
        file = SimpleUploadedFile('hw.pdf', b'pdf', content_type='application/pdf')
        res = self.client.post('/api/v1/schools/attachments/', {
            'kind': 'homework', 'title': 'واجب', 'file': file,
        }, format='multipart')
        self.assertEqual(res.status_code, 201)
        attachment_id = res.data['id']

        self.auth(self.teacher)
        res = self.client.post(f'/api/v1/schools/attachments/{attachment_id}/review/', {'review_status': 'approved'})
        self.assertEqual(res.status_code, 403)

        self.auth(self.admin)
        res = self.client.post(f'/api/v1/schools/attachments/{attachment_id}/review/', {
            'review_status': 'approved', 'review_notes': 'ممتاز',
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['review_status'], 'approved')
        self.assertEqual(res.data['review_notes'], 'ممتاز')
        attachment = Attachment.objects.get(id=attachment_id)
        self.assertEqual(attachment.reviewed_by, self.admin)

    def test_admin_my_context_lists_attachments(self):
        self.auth(self.student)
        file = SimpleUploadedFile('a.png', b'pngdata', content_type='image/png')
        res = self.client.post('/api/v1/schools/attachments/', {'kind': 'lesson', 'file': file}, format='multipart')
        self.assertEqual(res.status_code, 201)

        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(len(res.data['attachments']), 1)

    def test_analytics_reports_attachment_counts(self):
        self.auth(self.student)
        file = SimpleUploadedFile('b.png', b'pngdata', content_type='image/png')
        self.client.post('/api/v1/schools/attachments/', {'kind': 'submission', 'file': file}, format='multipart')

        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/analytics/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.data['attachments_total'], 1)
        self.assertGreaterEqual(res.data['attachments_pending_review'], 1)


class AttendanceFeatureTestCase(APITestCase):
    def setUp(self):
        self.admin = make_user('admin@test.com', 'admin', 'مدير الاختبار')
        self.student = make_user('student@test.com', 'student', 'طالب الاختبار', national_id='1234567890', phone='0771000001')
        self.parent = make_user('parent@test.com', 'parent', 'ولي أمر الاختبار', phone='0772000001')
        self.teacher = make_user('teacher@test.com', 'teacher', 'معلم الاختبار', phone='0773000001')

        self.grade = Grade.objects.create(level=5, translations={'ar': {'name': 'الصف الخامس'}})
        self.subject = Subject.objects.create(translations={'ar': {'name': 'العلوم'}})
        self.year = AcademicYear.objects.create(name='2025/2026', is_current=True)
        self.school = School.objects.create(name='مدرسة الحضور', school_code='AT1')
        self.section_a = Section.objects.create(school=self.school, grade=self.grade, academic_year=self.year, name='أ')
        self.section_b = Section.objects.create(school=self.school, grade=self.grade, academic_year=self.year, name='ب')

        StudentEnrollment.objects.create(student=self.student, section=self.section_a, academic_year=self.year)
        TeacherAssignment.objects.create(teacher=self.teacher, section=self.section_a, subject=self.subject, academic_year=self.year)
        FamilyLink.objects.create(parent=self.parent, student=self.student, relationship='والد')

        self.target_date = '2026-08-03'  # a Monday (weekday, not skipped by the command)

    def auth(self, user):
        self.client.force_authenticate(user=user)

    def results(self, res):
        return res.data.get('results', res.data)

    def test_teacher_bulk_records_attendance(self):
        self.auth(self.teacher)
        res = self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'present'}],
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created'], 1)
        attendance = Attendance.objects.get(student=self.student, date=self.target_date)
        self.assertEqual(attendance.status, 'present')
        self.assertEqual(attendance.recorded_by, self.teacher)
        self.assertEqual(attendance.section, self.section_a)

    def test_teacher_cannot_record_unassigned_section(self):
        self.auth(self.teacher)
        res = self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_b.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'present'}],
        }, format='json')
        self.assertEqual(res.status_code, 403)

    def test_absent_triggers_whatsapp_and_inapp_alert(self):
        self.auth(self.teacher)
        from apps.notifications.models import Notification
        res = self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'absent'}],
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['absent_alerts_sent'], 1)
        self.assertTrue(WhatsAppNotificationLog.objects.filter(recipient_phone=self.parent.phone).exists())
        self.assertTrue(Notification.objects.filter(user=self.parent, type='absence').exists())

    def test_bulk_record_is_idempotent(self):
        self.auth(self.teacher)
        payload = {
            'section': self.section_a.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'present'}],
        }
        self.client.post('/api/v1/schools/attendances/bulk_record/', payload, format='json')
        res = self.client.post('/api/v1/schools/attendances/bulk_record/', payload, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['updated'], 1)
        self.assertEqual(Attendance.objects.filter(student=self.student, date=self.target_date).count(), 1)

    def test_teacher_list_scoped_to_assigned_sections(self):
        self.auth(self.teacher)
        Attendance.objects.create(student=self.student, section=self.section_a, school=self.school, date=self.target_date, status='present')
        other = make_user('other@test.com', 'student', 'طالب آخر', phone='0779000001')
        StudentEnrollment.objects.create(student=other, section=self.section_b, academic_year=self.year)
        Attendance.objects.create(student=other, section=self.section_b, school=self.school, date=self.target_date, status='present')

        res = self.client.get('/api/v1/schools/attendances/')
        self.assertEqual(res.status_code, 200)
        students = {a['student'] for a in self.results(res)}
        self.assertIn(self.student.id, students)
        self.assertNotIn(other.id, students)

    def test_enrollments_filtered_by_section(self):
        self.auth(self.teacher)
        other = make_user('other@test.com', 'student', 'طالب آخر', phone='0779000001')
        StudentEnrollment.objects.create(student=other, section=self.section_b, academic_year=self.year)

        res = self.client.get('/api/v1/schools/enrollments/', {'section': self.section_a.id})
        self.assertEqual(res.status_code, 200)
        data = self.results(res)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student'], self.student.id)
        self.assertEqual(data[0]['section'], self.section_a.id)

    def test_parent_views_child_attendance(self):
        self.auth(self.teacher)
        self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'absent'}],
        }, format='json')
        self.auth(self.parent)
        res = self.client.get(f'/api/v1/schools/attendances/?date={self.target_date}')
        self.assertEqual(res.status_code, 200)
        data = self.results(res)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['student_email'], 'student@test.com')
        self.assertEqual(data[0]['status'], 'absent')

    def test_student_own_attendance_in_my_context(self):
        self.auth(self.teacher)
        self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': self.target_date,
            'records': [{'student': self.student.id, 'status': 'present'}],
        }, format='json')
        self.auth(self.student)
        res = self.client.get('/api/v1/schools/my-context/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['attendance']), 1)
        self.assertEqual(res.data['attendance'][0]['status'], 'present')

    def test_weekly_summary_uses_real_attendance(self):
        from datetime import date, timedelta
        monday = date.today() - timedelta(days=date.today().weekday())
        self.auth(self.teacher)
        self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': monday.isoformat(),
            'records': [{'student': self.student.id, 'status': 'present'}],
        }, format='json')
        self.auth(self.parent)
        res = self.client.get('/api/v1/schools/weekly-summary/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['reports'][0]['attendance_rate'], 100.0)

    def test_analytics_reports_attendance_counts(self):
        from django.utils import timezone
        self.auth(self.teacher)
        self.client.post('/api/v1/schools/attendances/bulk_record/', {
            'section': self.section_a.id,
            'date': timezone.localdate().isoformat(),
            'records': [{'student': self.student.id, 'status': 'absent'}],
        }, format='json')
        self.auth(self.admin)
        res = self.client.get('/api/v1/schools/analytics/')
        self.assertEqual(res.status_code, 200)
        self.assertGreaterEqual(res.data['attendance_today'], 1)
        self.assertGreaterEqual(res.data['absent_today'], 1)

    def test_send_absence_alerts_command(self):
        from django.core.management import call_command
        call_command('send_absence_alerts', date=self.target_date)
        attendance = Attendance.objects.get(student=self.student, date=self.target_date)
        self.assertEqual(attendance.status, 'absent')
        self.assertTrue(WhatsAppNotificationLog.objects.filter(recipient_phone=self.parent.phone).exists())
        from apps.notifications.models import Notification
        self.assertTrue(Notification.objects.filter(user=self.parent, type='absence').exists())

    def test_send_absence_alerts_is_idempotent(self):
        from django.core.management import call_command
        call_command('send_absence_alerts', date=self.target_date)
        call_command('send_absence_alerts', date=self.target_date)
        self.assertEqual(Attendance.objects.filter(student=self.student, date=self.target_date).count(), 1)
        self.assertEqual(WhatsAppNotificationLog.objects.count(), 1)

    def test_send_absence_alerts_dry_run(self):
        from django.core.management import call_command
        call_command('send_absence_alerts', date=self.target_date, dry_run=True)
        self.assertFalse(Attendance.objects.filter(student=self.student, date=self.target_date).exists())
        self.assertFalse(WhatsAppNotificationLog.objects.exists())

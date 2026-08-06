from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.academics.models import Grade, Subject
from apps.schools.models import (
    AcademicYear,
    ParentTeacherTicket,
    School,
    SchoolAnnouncement,
    Section,
    StudentEnrollment,
    TeacherAssignment,
)

User = get_user_model()


class SchoolsAPITestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass', role='admin'
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass', role='student'
        )
        self.student2 = User.objects.create_user(
            email='student2@test.com', password='pass', role='student'
        )
        self.teacher = User.objects.create_user(
            email='teacher@test.com', password='pass', role='teacher'
        )

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

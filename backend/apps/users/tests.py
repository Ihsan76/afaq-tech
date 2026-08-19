from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.users.models import UserRole
from apps.users.services import RoleService

User = get_user_model()


class UserRoleModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="test@example.com", password="testpass123")
        self.admin = User.objects.create_user(email="admin@example.com", password="testpass123", is_staff=True)

    def test_assign_role(self):
        user_role = RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        self.assertIsNotNone(user_role)
        self.assertEqual(user_role.role, "teacher")
        self.assertTrue(user_role.is_active)
        self.assertIn("teacher", self.user.roles)

    def test_assign_duplicate_role(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        self.assertEqual(UserRole.objects.filter(user=self.user, role="teacher", is_active=True).count(), 1)

    def test_revoke_role(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.revoke_role(self.user, "teacher")
        self.assertFalse(UserRole.objects.filter(user=self.user, role="teacher", is_active=True).exists())
        self.assertNotIn("teacher", self.user.roles)

    def test_has_role(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        self.assertTrue(RoleService.has_role(self.user, "teacher"))
        self.assertFalse(RoleService.has_role(self.user, "student"))

    def test_get_user_roles(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.assign_role(self.user, "parent", assigned_by=self.admin)
        roles = RoleService.get_user_roles(self.user)
        self.assertEqual(roles.count(), 2)

    def test_sync_roles_field(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.assign_role(self.user, "parent", assigned_by=self.admin)
        self.user.refresh_from_db()
        self.assertIn("teacher", self.user.roles)
        self.assertIn("parent", self.user.roles)

    def test_multi_role_user(self):
        """A user can have teacher + instructor roles simultaneously."""
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.assign_role(self.user, "instructor", assigned_by=self.admin)
        self.assertTrue(RoleService.has_role(self.user, "teacher"))
        self.assertTrue(RoleService.has_role(self.user, "instructor"))
        self.assertEqual(RoleService.get_user_roles(self.user).count(), 2)
        self.user.refresh_from_db()
        self.assertIn("teacher", self.user.roles)
        self.assertIn("instructor", self.user.roles)


class SchoolTeacherAutoSyncTest(TestCase):
    """Test that creating/deleting SchoolTeacher auto-creates/revokes UserRole."""

    def setUp(self):
        from apps.schools.models import School, SchoolTeacher
        self.School = School
        self.SchoolTeacher = SchoolTeacher
        self.admin = User.objects.create_user(email="admin@example.com", password="testpass123", is_staff=True)
        self.school = School.objects.create(name="Test School", school_code="TS001", manager=self.admin)

    def test_create_school_teacher_assigns_role(self):
        teacher = User.objects.create_user(email="teacher@example.com", password="testpass123")
        self.SchoolTeacher.objects.create(school=self.school, teacher=teacher)
        self.assertTrue(RoleService.has_role(teacher, "teacher"))

    def test_delete_last_school_teacher_revokes_role(self):
        teacher = User.objects.create_user(email="teacher@example.com", password="testpass123")
        link = self.SchoolTeacher.objects.create(school=self.school, teacher=teacher)
        self.assertTrue(RoleService.has_role(teacher, "teacher"))
        link.delete()
        self.assertFalse(RoleService.has_role(teacher, "teacher"))

    def test_delete_one_of_two_schools_keeps_role(self):
        school2 = self.School.objects.create(name="Test School 2", school_code="TS002", manager=self.admin)
        teacher = User.objects.create_user(email="teacher@example.com", password="testpass123")
        link1 = self.SchoolTeacher.objects.create(school=self.school, teacher=teacher)
        self.SchoolTeacher.objects.create(school=school2, teacher=teacher)
        link1.delete()
        self.assertTrue(RoleService.has_role(teacher, "teacher"))


class MyRolesAPITest(TestCase):
    """Test the /auth/my-roles/ endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="test@example.com", password="testpass123")
        self.admin = User.objects.create_user(email="admin@example.com", password="testpass123", is_staff=True)

    def test_my_roles_unauthenticated(self):
        resp = self.client.get("/api/v1/auth/my-roles/")
        self.assertIn(resp.status_code, [401, 403])

    def test_my_roles_empty(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/v1/auth/my-roles/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total"], 0)

    def test_my_roles_with_role(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/v1/auth/my-roles/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total"], 1)
        self.assertEqual(resp.data["roles"][0]["role"], "teacher")
        self.assertIn("icon", resp.data["roles"][0])
        self.assertIn("context_url", resp.data["roles"][0])

    def test_my_roles_multi_role(self):
        RoleService.assign_role(self.user, "teacher", assigned_by=self.admin)
        RoleService.assign_role(self.user, "instructor", assigned_by=self.admin)
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/v1/auth/my-roles/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["total"], 2)
        role_names = {r["role"] for r in resp.data["roles"]}
        self.assertEqual(role_names, {"teacher", "instructor"})

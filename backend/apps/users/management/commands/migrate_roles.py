"""
Populate UserRole records and the roles JSONField from existing data.

Usage:
    python manage.py migrate_roles --dry-run   # preview what would happen
    python manage.py migrate_roles              # apply
"""

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Migrate existing role data into UserRole records and roles JSONField"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without committing",
        )

    def _sync_user_roles(self, user):
        """Sync the roles JSONField from UserRole records."""
        from apps.users.models import UserRole
        user.roles = list(
            UserRole.objects.filter(user=user, is_active=True)
            .values_list('role', flat=True).distinct()
        )
        user.save(update_fields=['roles'])

    def handle(self, *args, **options):
        from django.contrib.auth import get_user_model
        from apps.users.models import UserRole
        from apps.schools.models import SchoolTeacher

        User = get_user_model()
        dry_run = options["dry_run"]

        # Step 1: Migrate from User.role field
        users_with_role = User.objects.filter(role__isnull=False).exclude(role="")
        total = users_with_role.count()
        created = 0
        skipped = 0

        self.stdout.write(f"Step 1: Found {total} users with role field set.")

        with transaction.atomic():
            for user in users_with_role.iterator():
                role = user.role
                exists = UserRole.objects.filter(
                    user=user, role=role, organization__isnull=True
                ).exists()

                if exists:
                    skipped += 1
                    continue

                if not dry_run:
                    UserRole.objects.create(
                        user=user,
                        role=role,
                        organization=None,
                        assigned_by=None,
                        is_active=True,
                    )
                created += 1

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(
            f"Step 1 done. Created: {created}, Skipped: {skipped}"
        ))

        # Step 2: Migrate from SchoolTeacher records
        school_teachers = SchoolTeacher.objects.select_related('teacher').all()
        st_total = school_teachers.count()
        st_created = 0
        st_skipped = 0

        self.stdout.write(f"\nStep 2: Found {st_total} SchoolTeacher records.")

        with transaction.atomic():
            for st in school_teachers.iterator():
                exists = UserRole.objects.filter(
                    user=st.teacher, role='teacher', organization__isnull=True
                ).exists()

                if exists:
                    st_skipped += 1
                    continue

                if not dry_run:
                    UserRole.objects.create(
                        user=st.teacher,
                        role='teacher',
                        organization=None,
                        assigned_by=None,
                        is_active=True,
                    )
                    self._sync_user_roles(st.teacher)
                st_created += 1

            if dry_run:
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS(
            f"Step 2 done. Created: {st_created}, Skipped: {st_skipped}"
        ))

        # Step 3: Sync all affected users' roles JSONField
        if not dry_run:
            affected_user_ids = set()
            for ur in UserRole.objects.filter(is_active=True).select_related('user'):
                affected_user_ids.add(ur.user_id)

            self.stdout.write(f"\nStep 3: Syncing roles JSONField for {len(affected_user_ids)} users.")
            for uid in affected_user_ids:
                user = User.objects.get(pk=uid)
                self._sync_user_roles(user)

        self.stdout.write(self.style.SUCCESS("\nMigration complete."))

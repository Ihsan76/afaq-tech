from django.db.models import Q

from .models import User, UserRole


class RoleService:
    """Unified service for managing user roles and permissions."""

    @staticmethod
    def has_role(user, role, organization=None):
        """Check if a user has a specific role (optionally scoped to an organization)."""
        if not user or not user.is_authenticated:
            return False
        qs = UserRole.objects.filter(user=user, role=role, is_active=True)
        if organization is not None:
            qs = qs.filter(organization=organization)
        else:
            qs = qs.filter(organization__isnull=True)
        return qs.exists()

    @staticmethod
    def has_role_anywhere(user, role):
        """Check if a user has a role in ANY organization or globally."""
        if not user or not user.is_authenticated:
            return False
        return UserRole.objects.filter(user=user, role=role, is_active=True).exists()

    @staticmethod
    def has_role_in_school(user, role, school):
        """Check if a user has a role in a specific school (via Organization FK)."""
        if not user or not user.is_authenticated:
            return False
        return UserRole.objects.filter(
            user=user, role=role, is_active=True,
            organization__school=school
        ).exists()

    @staticmethod
    def get_user_roles(user, organization=None):
        """Get all active roles for a user, optionally filtered by organization."""
        qs = UserRole.objects.filter(user=user, is_active=True)
        if organization is not None:
            qs = qs.filter(organization=organization)
        return qs.select_related('organization')

    @staticmethod
    def get_role_names(user, organization=None):
        """Get a list of role name strings for a user."""
        return list(
            RoleService.get_user_roles(user, organization)
            .values_list('role', flat=True)
            .distinct()
        )

    @staticmethod
    def assign_role(user, role, assigned_by=None, organization=None):
        """Assign a role to a user. Creates UserRole and syncs the roles JSONField."""
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            role=role,
            organization=organization,
            defaults={'assigned_by': assigned_by}
        )
        if not created and not user_role.is_active:
            user_role.is_active = True
            user_role.assigned_by = assigned_by
            user_role.save(update_fields=['is_active', 'assigned_by'])
        RoleService._sync_roles_field(user)
        return user_role

    @staticmethod
    def revoke_role(user, role, organization=None):
        """Deactivate a role assignment for a user."""
        updated = UserRole.objects.filter(
            user=user, role=role, organization=organization, is_active=True
        ).update(is_active=False)
        if updated:
            RoleService._sync_roles_field(user)
        return updated > 0

    @staticmethod
    def can_assign_role(assigner, role_to_assign, organization=None):
        """Check if the assigner has permission to assign a given role."""
        if not assigner or not assigner.is_authenticated:
            return False
        if assigner.is_superuser or assigner.is_staff:
            return True
        if RoleService.has_role(assigner, 'admin'):
            return True
        school_roles = {
            'teacher', 'school_accountant',
            'school_transport_officer', 'school_librarian'
        }
        if RoleService.has_role(assigner, 'school_admin'):
            if role_to_assign in school_roles:
                return RoleService.has_role_in_school(assigner, 'school_admin', organization)
        return False

    @staticmethod
    def _sync_roles_field(user):
        """Sync the roles JSONField from UserRole records."""
        user.roles = RoleService.get_role_names(user)
        user.save(update_fields=['roles'])

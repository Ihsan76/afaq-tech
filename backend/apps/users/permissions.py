from rest_framework.permissions import SAFE_METHODS, BasePermission

# Admin-team roles that may enter the admin dashboard at all.
ADMIN_ROLES = {'admin', 'developer', 'support', 'content_manager', 'finance'}

# Read-only admin roles can list/view but not mutate.
READONLY_ROLES = {'support'}

# Section -> roles mapping (mirrors the frontend admin nav).
SECTION_ROLES = {
    'content':       {'admin', 'developer', 'content_manager'},
    'education':     {'admin', 'developer', 'content_manager'},
    'blog':          {'admin', 'developer', 'content_manager'},
    'ebooks':        {'admin', 'developer', 'content_manager'},
    'courses':       {'admin', 'developer', 'content_manager'},
    'marketplace':   {'admin', 'developer'},
    'ai':            {'admin', 'developer'},
    'messages':      {'admin', 'developer', 'support'},
    'users':         {'admin', 'developer', 'support'},
    'subscriptions': {'admin', 'finance'},
    'organizations': {'admin', 'developer'},
    'settings':      {'admin', 'developer'},
    'schools':       {'admin', 'developer'},
}


def is_admin_role(user):
    return bool(
        user and user.is_authenticated and (
            user.is_superuser or user.is_staff or user.role in ADMIN_ROLES
        )
    )


def user_sections(user):
    """Sections a user may access in the admin dashboard."""
    if not (user and user.is_authenticated):
        return set()
    if user.is_superuser or user.is_staff or user.role == 'admin':
        return set(SECTION_ROLES.keys())
    return {s for s, roles in SECTION_ROLES.items() if user.role in roles}


class IsAdminRole(BasePermission):
    """Any admin-team role (or staff/superuser). Write ops blocked for read-only roles."""
    def has_permission(self, request, view):
        if not is_admin_role(request.user):
            return False
        return not (request.user.role in READONLY_ROLES and request.method not in SAFE_METHODS)


class IsSystemAdmin(BasePermission):
    """System admin only (or staff/superuser)."""
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (
            u.is_superuser or u.is_staff or u.role == 'admin'
        ))


class IsSectionAdmin(BasePermission):
    """Base: role must belong to `section` (see SECTION_ROLES)."""
    section = None

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.is_superuser or u.is_staff or u.role == 'admin':
            return True
        allowed = SECTION_ROLES.get(self.section or '', set())
        if u.role not in allowed:
            return False
        return not (u.role in READONLY_ROLES and request.method not in SAFE_METHODS)


class IsContentAdmin(IsSectionAdmin):
    """Pages, menus, templates, blog, ebooks, courses, academics."""
    section = 'content'


class IsAIAdmin(IsSectionAdmin):
    section = 'ai'


class IsMarketplaceAdmin(IsSectionAdmin):
    section = 'marketplace'


class IsMessagesAdmin(IsSectionAdmin):
    section = 'messages'


class IsUsersAdmin(IsSectionAdmin):
    """Users list: support/developer read-only; role/plan changes are system-admin only."""
    section = 'users'


class IsFinanceAdmin(IsSectionAdmin):
    section = 'subscriptions'


class IsOrganizationsAdmin(IsSectionAdmin):
    section = 'organizations'


class IsSettingsAdmin(IsSectionAdmin):
    section = 'settings'

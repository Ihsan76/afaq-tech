from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle, UserRateThrottle


class ResilientAnonRateThrottle(AnonRateThrottle):
    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            return True


class ResilientUserRateThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            return True


class ResilientScopedRateThrottle(ScopedRateThrottle):
    def allow_request(self, request, view):
        try:
            return super().allow_request(request, view)
        except Exception:
            return True

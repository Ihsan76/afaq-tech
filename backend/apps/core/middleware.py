from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """Adds Content-Security-Policy and hardening headers to API responses."""

    CSP = (
        "default-src 'none'; "
        "connect-src 'self'; "
        "img-src 'self' data: blob: https://*.supabase.co; "
        "font-src 'self' data:; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "upgrade-insecure-requests"
    )

    HEADERS = {
        "Content-Security-Policy": CSP,
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), interest-cohort=()",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
    }

    def process_response(self, request, response):
        for key, value in self.HEADERS.items():
            if key not in response:
                response[key] = value
        return response

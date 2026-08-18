import os

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
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "geolocation=(), interest-cohort=(), camera=(), microphone=(self)",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-DNS-Prefetch-Control": "on",
    }

    PROD_HEADERS = {
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    }

    def process_response(self, request, response):
        if not request.path.startswith('/api/'):
            return response

        if 'Content-Security-Policy' not in response:
            response['Content-Security-Policy'] = self.CSP

        for key, value in self.HEADERS.items():
            if key not in response:
                response[key] = value

        if os.environ.get('ENVIRONMENT') == 'production':
            for key, value in self.PROD_HEADERS.items():
                if key not in response:
                    response[key] = value

        return response

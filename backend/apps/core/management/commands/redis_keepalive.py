"""Redis Keep-Alive: Sends periodic PING to keep Upstash Redis active.

Supports two methods:
  1. Redis protocol (rediss://) - used when port 6379 is reachable
  2. Upstash HTTP API (fallback) - works from any network

Usage:
    python manage.py redis_keepalive              # Single ping
    python manage.py redis_keepalive --check       # Check connection only
    python manage.py redis_keepalive --verbose     # Show details
    python manage.py redis_keepalive --http        # Force HTTP API method
"""

import os
import sys
import urllib.error
import urllib.request
from datetime import datetime

from django.core.management.base import BaseCommand


def _parse_upstash_http_url(redis_url: str) -> tuple[str, str] | None:
    """Convert rediss:// URL to Upstash HTTP REST URL + token."""
    if not redis_url.startswith("rediss://") and not redis_url.startswith("redis://"):
        return None

    # Extract password (token) and host from URL
    # Format: rediss://default:TOKEN@HOST:PORT
    try:
        without_scheme = redis_url.split("://", 1)[1]
        auth, host_port = without_scheme.rsplit("@", 1)
        token = auth.split(":", 1)[1]
        host = host_port.split(":")[0]
        return f"https://{host}", token
    except (IndexError, ValueError):
        return None


def _ping_via_http(base_url: str, token: str) -> dict:
    """Ping Upstash Redis via HTTP REST API."""
    url = f"{base_url}/ping"
    req = urllib.request.Request(
        url,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        data=b'["PING"]',
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return {"status": resp.status, "body": resp.read().decode()}


def _ping_via_redis(redis_url: str) -> dict:
    """Ping Upstash Redis via Redis protocol."""
    import redis as redis_lib

    r = redis_lib.from_url(
        redis_url,
        socket_timeout=10,
        socket_connect_timeout=10,
        ssl_cert_reqs="none",
    )
    pong = r.ping()
    info = r.info("server")
    r.close()
    return {
        "pong": pong,
        "version": info.get("redis_version", "unknown"),
        "uptime": info.get("uptime_in_seconds", 0),
        "clients": info.get("connected_clients", 0),
    }


class Command(BaseCommand):
    help = "إرسال PING إلى Redis للحفاظ على نشاط قاعدة بيانات Upstash"

    def add_arguments(self, parser):
        parser.add_argument("--check", action="store_true", help="التحقق من الاتصال فقط")
        parser.add_argument("--verbose", action="store_true", help="عرض تفاصيل الاتصال")
        parser.add_argument("--http", action="store_true", help="إجبار استخدام HTTP API")

    def handle(self, *args, **options):
        redis_url = os.environ.get("REDIS_URL", "")
        if not redis_url or "localhost" in redis_url:
            self.stdout.write(self.style.WARNING(
                "⚠️  REDIS_URL غير مُعد أو يشير إلى localhost.\n"
                "   يرجى تحديث REDIS_URL في ملف .env برابط Upstash.\n"
                "   الشكل: rediss://default:xxxxx@xxxxx.upstash.io:6379"
            ))
            return

        now = datetime.now().isoformat()
        http_info = _parse_upstash_http_url(redis_url)
        use_http = options["http"] or http_info is not None

        # Try Redis protocol first (unless --http forced)
        if not use_http:
            try:
                result = _ping_via_redis(redis_url)
                self.stdout.write(self.style.SUCCESS(f"✅ PING → PONG (Redis) | {now}"))
                if options["verbose"]:
                    self.stdout.write(
                        f"   Redis: {result['version']} | "
                        f"Uptime: {result['uptime']}s | "
                        f"Clients: {result['clients']}"
                    )
                return
            except Exception:
                if not http_info:
                    self.stderr.write("❌ فشل الاتصال بـ Redis ولم يتم العثور على HTTP API")
                    sys.exit(1)
                # Fall through to HTTP
                use_http = True

        # HTTP API fallback
        if use_http and http_info:
            base_url, token = http_info
            try:
                result = _ping_via_http(base_url, token)
                self.stdout.write(self.style.SUCCESS(f"✅ PING → PONG (HTTP) | {now}"))
                if options["verbose"]:
                    self.stdout.write(f"   Status: {result['status']} | Response: {result['body']}")
                return
            except urllib.error.HTTPError as e:
                self.stderr.write(f"❌ HTTP API error: {e.code} {e.reason}")
                sys.exit(1)
            except Exception as e:
                self.stderr.write(f"❌ فشل الاتصال عبر HTTP API: {e}")
                sys.exit(1)

        self.stderr.write("❌ لا يمكن تحديد طريقة الاتصال بـ Redis")
        sys.exit(1)

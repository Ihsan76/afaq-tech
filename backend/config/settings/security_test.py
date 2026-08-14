"""
Isolated security/QA test settings — file-backed SQLite so a running
server persists data across requests. Never touches the real database.
Run: DJANGO_SETTINGS_MODULE=config.settings.security_test
"""
import os

from .testing import *  # noqa: F401,F403

# Persistent file DB (override the in-memory one from testing.py).
_DB_PATH = os.environ.get(
    'SECURITY_DB_PATH',
    '/tmp/afaqsec/security.db',
)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': _DB_PATH,
        'CONN_MAX_AGE': 300,
        'CONN_HEALTH_CHECKS': True,
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'afaq-security-test',
    },
}

ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

# Faster hashing for the throwaway env (keeps tests snappy).
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
]

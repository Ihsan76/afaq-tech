import base64 as _b64
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

os.environ['SENTRY_DSN_BACKEND'] = ''
os.environ.setdefault('RESEND_API_KEY', '')
os.environ.setdefault('SUPABASE_URL', '')
os.environ.setdefault('SUPABASE_KEY', '')

_private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public = _private.public_key()
os.environ.setdefault(
    'JWT_PRIVATE_KEY_B64',
    _b64.b64encode(
        _private.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    ).decode(),
)
os.environ.setdefault(
    'JWT_PUBLIC_KEY_B64',
    _b64.b64encode(
        _public.public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    ).decode(),
)

from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

CORS_ALLOW_ALL_ORIGINS = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    },
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'afaq-test',
    },
}

REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10000/minute',
        'user': '10000/minute',
        'auth_login': '10000/minute',
        'auth_register': '10000/minute',
        'auth_verify': '10000/minute',
        'auth_reset': '10000/minute',
    },
}

GEMINI_API_KEY = ''
OPENAI_API_KEY = ''

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]


# ── SQLite compatibility for django.contrib.postgres.ArrayField ──────────────
# The test DB is SQLite, but MenuItem.service_context/required_role are
# ArrayFields (Postgres-only by default). Patch the field so it stores arrays
# as JSON TEXT on SQLite, leaving Postgres behaviour untouched.
import json as _json  # noqa: E402

from django.contrib.postgres.fields import ArrayField as _ArrayField  # noqa: E402

_orig_db_type = _ArrayField.db_type
_orig_get_db_prep_value = _ArrayField.get_db_prep_value
_orig_get_placeholder = _ArrayField.get_placeholder


def _sqlite_db_type(self, connection):
    if connection.vendor == 'sqlite':
        return 'TEXT'
    return _orig_db_type(self, connection)


def _sqlite_get_placeholder(self, lhs, compiler, connection):
    # Postgres emits (ARRAY[%s])::varchar(20)[] which SQLite cannot parse.
    if connection.vendor == 'sqlite':
        return '%s'
    return _orig_get_placeholder(self, lhs, compiler, connection)


def _sqlite_get_db_prep_value(self, value, connection, prepared=False):
    value = _orig_get_db_prep_value(self, value, connection, prepared)
    if connection.vendor == 'sqlite' and value is not None:
        return _json.dumps(list(value), ensure_ascii=False)
    return value


def _sqlite_from_db_value(self, value, expression, connection):
    if connection.vendor == 'sqlite':
        if value in (None, ''):
            return []
        return _json.loads(value)
    return value


_ArrayField.db_type = _sqlite_db_type
_ArrayField.get_placeholder = _sqlite_get_placeholder
_ArrayField.get_db_prep_value = _sqlite_get_db_prep_value
_ArrayField.from_db_value = _sqlite_from_db_value

# ── Replace ArrayField lookups for SQLite ────────────────────────────────────
# Postgres-specific lookups (ArrayExact/ArrayContains/ArrayOverlap/ArrayLen) wrap
# the RHS in `Func(function="ARRAY")`, emitting `(ARRAY[%s])::varchar(20)[]` which
# SQLite cannot parse. On SQLite the field is stored as JSON TEXT, so the plain
# Field lookups (Exact/Contains/In) work fine with the JSON-encoded values.
from django.db.models import fields as _django_fields  # noqa: E402
from django.db.models.lookups import (  # noqa: E402
    Contains as _PlainContains,
    Exact as _PlainExact,
    In as _PlainIn,
)

_ArrayField.class_lookups = _django_fields.Field.class_lookups.copy()
_ArrayField.class_lookups.update({
    'exact': _PlainExact,
    'contains': _PlainContains,
    'in': _PlainIn,
})

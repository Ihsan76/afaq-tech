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

import os

os.environ['SENTRY_DSN_BACKEND'] = ''
os.environ.setdefault('RESEND_API_KEY', '')

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

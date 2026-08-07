import os
from pathlib import Path

import environ

env = environ.Env()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-change-this-in-production')

DEBUG = env('DEBUG', default=False)

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'apps.users',
    'apps.academics',
    'apps.lessonplans',
    'apps.ai',
    'apps.core',
    'apps.themes',
    'apps.pages',
    'apps.blog',
    'apps.ebooks',
    'apps.courses',
    'apps.gamification',
    'apps.marketplace',
    'apps.subscriptions',
    'apps.schools',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'apps.core.middleware.SecurityHeadersMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default='postgres:///afaq_tech'),
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Asia/Amman'
USE_I18N = True
USE_TZ = True


STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'apps.core.throttling.ResilientAnonRateThrottle',
        'apps.core.throttling.ResilientUserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/minute',
        'user': '120/minute',
        'auth_login': '5/minute',
        'auth_register': '3/hour',
        'auth_verify': '5/minute',
        'auth_reset': '3/hour',
    },
}

import base64

JWT_PRIVATE_KEY = base64.b64decode(env('JWT_PRIVATE_KEY_B64', default='')).decode()
JWT_PUBLIC_KEY = base64.b64decode(env('JWT_PUBLIC_KEY_B64', default='')).decode()

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ALGORITHM': 'RS256',
    'SIGNING_KEY': JWT_PRIVATE_KEY,
    'VERIFYING_KEY': JWT_PUBLIC_KEY,
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.afaq.app',
    'https://afaq.app',
    'https://ihsan.afaq.app',
    'https://academy.afaq.app',
])

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://www.afaq.app',
    'https://afaq.app',
    'https://ihsan.afaq.app',
    'https://academy.afaq.app',
])

SUPABASE_URL = env('SUPABASE_URL')
SUPABASE_KEY = env('SUPABASE_KEY')

REDIS_URL = env('REDIS_URL', default='redis://localhost:6379')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'socket_connect_timeout': 0.3,
                'socket_timeout': 0.3,
            },
        },
        'KEY_PREFIX': 'afaq',
        'TIMEOUT': 300,
    },
}

DJANGO_REDIS_IGNORE_EXCEPTIONS = True
DJANGO_REDIS_LOG_IGNORED_EXCEPTIONS = True

SENTRY_DSN = env('SENTRY_DSN_BACKEND', default=None)
if SENTRY_DSN:
    import sentry_sdk
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.1)

GEMINI_API_KEY = env('GEMINI_API_KEY', default='')

RESEND_API_KEY = env('RESEND_API_KEY', default=None)
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='Afaq Tech <no-reply@afaq.app>')
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3000')

GOOGLE_OAUTH_CLIENT_ID = env('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = env('GOOGLE_OAUTH_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI = env('GOOGLE_REDIRECT_URI', default='http://localhost:8003/api/v1/auth/google/callback/')
GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URI = 'https://oauth2.googleapis.com/token'
GOOGLE_USERINFO_URI = 'https://www.googleapis.com/oauth2/v2/userinfo'

STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = env('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = env('STRIPE_WEBHOOK_SECRET', default='')

PAYMENT_PROVIDER = env('PAYMENT_PROVIDER', default='auto')
MYFATOORAH_API_TOKEN = env('MYFATOORAH_API_TOKEN', default='')
MYFATOORAH_BASE_URL = env('MYFATOORAH_BASE_URL', default='')
MYFATOORAH_WEBHOOK_SECRET = env('MYFATOORAH_WEBHOOK_SECRET', default='')
MYFATOORAH_PAYMENT_METHOD_ID = env('MYFATOORAH_PAYMENT_METHOD_ID', default='0')

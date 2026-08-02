import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.core.models import Language

LANGUAGES = [
    {'code': 'ar', 'name': 'Arabic', 'native_name': 'العربية', 'flag': '🇸🇦', 'is_rtl': True, 'order': 1, 'is_default': False},
    {'code': 'en', 'name': 'English', 'native_name': 'English', 'flag': '🇬🇧', 'is_rtl': False, 'order': 2, 'is_default': True},
    {'code': 'fr', 'name': 'French', 'native_name': 'Français', 'flag': '🇫🇷', 'is_rtl': False, 'order': 3},
    {'code': 'tr', 'name': 'Turkish', 'native_name': 'Türkçe', 'flag': '🇹🇷', 'is_rtl': False, 'order': 4},
    {'code': 'ur', 'name': 'Urdu', 'native_name': 'اردو', 'flag': '🇵🇰', 'is_rtl': True, 'order': 5},
    {'code': 'es', 'name': 'Spanish', 'native_name': 'Español', 'flag': '🇪🇸', 'is_rtl': False, 'order': 6},
    {'code': 'de', 'name': 'German', 'native_name': 'Deutsch', 'flag': '🇩🇪', 'is_rtl': False, 'order': 7},
    {'code': 'id', 'name': 'Indonesian', 'native_name': 'Bahasa Indonesia', 'flag': '🇮🇩', 'is_rtl': False, 'order': 8},
    {'code': 'bn', 'name': 'Bengali', 'native_name': 'বাংলা', 'flag': '🇧🇩', 'is_rtl': False, 'order': 9},
    {'code': 'fa', 'name': 'Persian', 'native_name': 'فارسی', 'flag': '🇮🇷', 'is_rtl': True, 'order': 10},
]

created = 0
updated = 0
for data in LANGUAGES:
    obj, was_created = Language.objects.update_or_create(
        code=data['code'],
        defaults=data,
    )
    if was_created:
        created += 1
    else:
        updated += 1

print(f'Languages seeded: {created} created, {updated} updated')

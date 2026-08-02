import os

import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.base'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.pages.models import MenuItem

menu_items = [
    {"menu": "header", "translations": {"en": {"title": "Home"}, "ar": {"title": "الرئيسية"}}, "url": "/", "icon": "🏠", "order": 0, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Academy"}, "ar": {"title": "الأكاديمية"}}, "url": "/academy", "icon": "🎓", "order": 1, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Curriculum"}, "ar": {"title": "المناهج"}}, "url": "/curriculum", "icon": "📚", "order": 2, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Blog"}, "ar": {"title": "المدونة"}}, "url": "/blog", "icon": "📝", "order": 3, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "E-Books"}, "ar": {"title": "الكتب الإلكترونية"}}, "url": "/ebooks", "icon": "📚", "order": 3, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "About Us"}, "ar": {"title": "من نحن"}}, "url": "/about", "icon": "ℹ️", "order": 0, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Privacy Policy"}, "ar": {"title": "سياسة الخصوصية"}}, "url": "/privacy", "icon": "🔒", "order": 1, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Terms of Service"}, "ar": {"title": "شروط الخدمة"}}, "url": "/terms", "icon": "📄", "order": 2, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Contact Us"}, "ar": {"title": "تواصل معنا"}, "fr": {"title": "Contactez-nous"}, "tr": {"title": "Bize Ulaşın"}, "ur": {"title": "ہم سے رابطہ کریں"}, "es": {"title": "Contáctenos"}, "de": {"title": "Kontaktieren Sie uns"}, "id": {"title": "Hubungi Kami"}, "bn": {"title": "যোগাযোগ করুন"}}, "url": "/contact", "icon": "📞", "order": 3, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "E-Books"}, "ar": {"title": "الكتب الإلكترونية"}}, "url": "/ebooks", "icon": "📚", "order": 4, "is_active": True},
]

created = 0
for item in menu_items:
    obj, is_new = MenuItem.objects.get_or_create(
        menu=item["menu"], url=item["url"],
        defaults=item
    )
    if is_new:
        created += 1
        print(f"  Created: {obj.translations.get('ar', {}).get('title', '')} / {obj.translations.get('en', {}).get('title', '')} ({obj.menu})")
    else:
        print(f"  Exists: {obj.translations.get('ar', {}).get('title', '')} / {obj.translations.get('en', {}).get('title', '')} ({obj.menu})")

print(f"\nTotal: {MenuItem.objects.count()} menu items ({created} new)")

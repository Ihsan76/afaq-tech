import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.core.models import FeatureFlag

FLAGS = [
    {'key': 'ai_assistant', 'name': 'مساعد الذكاء الاصطناعي', 'description': 'دردشة مساعد AI لجميع المستخدمين'},
    {'key': 'lesson_plans', 'name': 'خطط الدروس', 'description': 'توليد خطط الدروس بالذكاء الاصطناعي'},
    {'key': 'courses', 'name': 'الدورات التعليمية', 'description': 'منصة الدورات المجانية والمدفوعة'},
    {'key': 'gamification', 'name': 'نظام التلعيب', 'description': 'النقاط والشارات والإنجازات والتحديات'},
    {'key': 'marketplace', 'name': 'سوق الخدمات', 'description': 'سوق الخدمات الرقمية'},
    {'key': 'blog', 'name': 'المدوّنة', 'description': 'نظام المقالات والمدوّنة'},
    {'key': 'ebooks', 'name': 'الكتب الإلكترونية', 'description': 'مكتبة الكتب الإلكترونية'},
    {'key': 'payments', 'name': 'نظام الدفع', 'description': 'الدفع الإلكتروني (قريباً)'},
    {'key': 'newsletter', 'name': 'النشرة البريدية', 'description': 'الاشتراك في النشرة البريدية'},
    {'key': 'chat', 'name': 'الدردشة', 'description': 'الدردشة داخل المنصة'},
    {'key': 'search', 'name': 'البحث المتقدم', 'description': 'البحث في المحتوى والمنتجات'},
]

created = 0
updated = 0
for data in FLAGS:
    obj, was_created = FeatureFlag.objects.update_or_create(
        key=data['key'],
        defaults=data,
    )
    if was_created:
        created += 1
    else:
        updated += 1

print(f'FeatureFlags seeded: {created} created, {updated} updated')

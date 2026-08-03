"""
Seed the subscription plans (باقات الاشتراك).

Usage:
    cd backend && ./venv/bin/python seed_plans.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.subscriptions.models import Plan  # noqa: E402

PLANS = [
    {
        'code': 'free',
        'name': {'ar': 'مجاني', 'en': 'Free'},
        'description': {
            'ar': 'ابدأ مجاناً بدون أي التزامات.',
            'en': 'Start free with no commitments.',
        },
        'price': '0.00',
        'currency': 'SAR',
        'prices': {},
        'billing_period': Plan.BillingPeriod.MONTHLY,
        'duration_days': 30,
        'level': 0,
        'features': [
            {'ar': 'خطط دروس بالذكاء الاصطناعي (5/شهر)', 'en': 'AI lesson plans (5/month)'},
            {'ar': 'تصفح الدورات مجاناً', 'en': 'Free course browsing'},
            {'ar': 'المساعد الذكي (10 أسئلة/يوم)', 'en': 'AI assistant (10 questions/day)'},
            {'ar': 'تصدير نص عادي', 'en': 'Plain text export'},
            {'ar': 'دعم مجتمعي', 'en': 'Community support'},
        ],
        'sort_order': 1,
    },
    {
        'code': 'pro',
        'name': {'ar': 'احترافي', 'en': 'Professional'},
        'description': {
            'ar': 'كل الأدوات المتقدمة للمعلمين المحترفين.',
            'en': 'All advanced tools for professional educators.',
        },
        'price': '9.99',
        'currency': 'SAR',
        'prices': {
            'SAR': '9.99',
            'JOD': '1.90',
            'USD': '2.66',
            'AED': '9.77',
            'EGP': '80.00',
            'EUR': '2.45',
            'TRY': '90.00',
        },
        'billing_period': Plan.BillingPeriod.MONTHLY,
        'duration_days': 30,
        'level': 2,
        'features': [
            {'ar': 'خطط دروس بالذكاء الاصطناعي غير محدودة', 'en': 'Unlimited AI lesson plans'},
            {'ar': 'جميع الدورات', 'en': 'All courses'},
            {'ar': 'المساعد الذكي غير محدود', 'en': 'Unlimited AI assistant'},
            {'ar': 'تصدير PDF + Word', 'en': 'PDF + Word export'},
            {'ar': 'أولوية في التوليد', 'en': 'Priority generation'},
            {'ar': 'دعم عبر البريد الإلكتروني', 'en': 'Email support'},
        ],
        'sort_order': 2,
    },
    {
        'code': 'school',
        'name': {'ar': 'للمدارس', 'en': 'School'},
        'description': {
            'ar': 'حل متكامل للمدارس والمعلمين.',
            'en': 'A complete solution for schools and teachers.',
        },
        'price': '49.99',
        'currency': 'SAR',
        'prices': {
            'SAR': '49.99',
            'JOD': '9.50',
            'USD': '13.33',
            'AED': '49.00',
            'EGP': '400.00',
            'EUR': '12.30',
            'TRY': '450.00',
        },
        'billing_period': Plan.BillingPeriod.MONTHLY,
        'duration_days': 30,
        'level': 2,
        'features': [
            {'ar': 'كل ميزات الخطة الاحترافية', 'en': 'All Professional plan features'},
            {'ar': 'حسابات متعددة للمعلمين', 'en': 'Multiple teacher accounts'},
            {'ar': 'تقارير متقدمة', 'en': 'Advanced reports'},
            {'ar': 'دعم فني مخصص', 'en': 'Dedicated support'},
        ],
        'sort_order': 3,
    },
    {
        'code': 'enterprise',
        'name': {'ar': 'مؤسسي', 'en': 'Enterprise'},
        'description': {
            'ar': 'حلول مخصصة للمؤسسات التعليمية.',
            'en': 'Custom solutions for educational institutions.',
        },
        'price': '199.00',
        'currency': 'SAR',
        'prices': {
            'SAR': '199.00',
            'JOD': '38.00',
            'USD': '53.00',
            'AED': '195.00',
            'EGP': '1600.00',
            'EUR': '49.00',
            'TRY': '1800.00',
        },
        'billing_period': Plan.BillingPeriod.YEARLY,
        'duration_days': 365,
        'level': 3,
        'features': [
            {'ar': 'كل ميزات خطة المدارس', 'en': 'All School plan features'},
            {'ar': 'مستخدمون متعددون حسب الاتفاق', 'en': 'Multiple users by agreement'},
            {'ar': 'تكامل API', 'en': 'API integration'},
            {'ar': 'تخصيص المنصة', 'en': 'Platform customization'},
        ],
        'sort_order': 4,
    },
]


def main():
    created, updated = 0, 0
    for data in PLANS:
        code = data['code']
        _, was_created = Plan.objects.update_or_create(code=code, defaults=data)
        if was_created:
            created += 1
        else:
            updated += 1
        print(f"  • {code}: {'created' if was_created else 'updated'}")
    print(f"Done — {created} created, {updated} updated, {Plan.objects.count()} plans total.")


if __name__ == '__main__':
    main()

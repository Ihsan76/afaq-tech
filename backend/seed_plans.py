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

from apps.subscriptions.models import Currency, Plan, PlanService, PlanServiceLimit  # noqa: E402

CURRENCIES = [
    {
        'code': 'JOD',
        'name': {'ar': 'دينار أردني', 'en': 'Jordanian Dinar'},
        'symbol': 'د.أ',
        'rate': '1.0',
        'is_base': True,
        'sort_order': 1,
    },
    {
        'code': 'SAR',
        'name': {'ar': 'ريال سعودي', 'en': 'Saudi Riyal'},
        'symbol': 'ر.س',
        'rate': '5.29',
        'sort_order': 2,
    },
    {
        'code': 'USD',
        'name': {'ar': 'دولار أمريكي', 'en': 'US Dollar'},
        'symbol': '$',
        'rate': '1.41',
        'sort_order': 3,
    },
    {
        'code': 'AED',
        'name': {'ar': 'درهم إماراتي', 'en': 'UAE Dirham'},
        'symbol': 'د.إ',
        'rate': '5.19',
        'sort_order': 4,
    },
    {
        'code': 'EGP',
        'name': {'ar': 'جنيه مصري', 'en': 'Egyptian Pound'},
        'symbol': 'ج.م',
        'rate': '67.50',
        'sort_order': 5,
    },
    {
        'code': 'EUR',
        'name': {'ar': 'يورو', 'en': 'Euro'},
        'symbol': '€',
        'rate': '1.31',
        'sort_order': 6,
    },
    {
        'code': 'TRY',
        'name': {'ar': 'ليرة تركية', 'en': 'Turkish Lira'},
        'symbol': '₺',
        'rate': '48.50',
        'sort_order': 7,
    },
    {
        'code': 'KWD',
        'name': {'ar': 'دينار كويتي', 'en': 'Kuwaiti Dinar'},
        'symbol': 'د.ك',
        'rate': '0.43',
        'sort_order': 8,
    },
    {
        'code': 'QAR',
        'name': {'ar': 'ريال قطري', 'en': 'Qatari Riyal'},
        'symbol': 'ر.ق',
        'rate': '5.14',
        'sort_order': 9,
    },
]


SERVICES = [
    {
        'code': 'ai_lesson_plans',
        'name': {'ar': 'خطط دروس بالذكاء الاصطناعي', 'en': 'AI Lesson Plans'},
        'description': {'ar': 'إنشاء خطط الدروس بالذكاء الاصطناعي', 'en': 'Generate AI lesson plans'},
        'sort_order': 1,
    },
    {
        'code': 'ai_assistant',
        'name': {'ar': 'المساعد الذكي', 'en': 'AI Assistant'},
        'description': {'ar': 'الأسئلة والاستفسارات عبر المساعد الذكي', 'en': 'AI assistant questions and queries'},
        'sort_order': 2,
    },
    {
        'code': 'export_pdf',
        'name': {'ar': 'تصدير PDF و Word', 'en': 'PDF + Word Export'},
        'description': {'ar': 'تصدير خطط الدروس إلى PDF أو Word', 'en': 'Export lesson plans to PDF or Word'},
        'sort_order': 3,
    },
    {
        'code': 'ebook_download',
        'name': {'ar': 'تحميل الكتب الإلكترونية', 'en': 'E-Book Downloads'},
        'description': {'ar': 'تحميل الكتب الإلكترونية', 'en': 'Download e-books'},
        'sort_order': 4,
    },
]

FREE_LIMITS = [
    {'service_code': 'ai_lesson_plans', 'limit': 5, 'period': 'monthly', 'sort_order': 1},
    {'service_code': 'ai_assistant', 'limit': 10, 'period': 'daily', 'sort_order': 2},
]

PLANS = [
    {
        'code': 'free',
        'name': {'ar': 'مجاني', 'en': 'Free'},
        'description': {
            'ar': 'ابدأ مجاناً بدون أي التزامات.',
            'en': 'Start free with no commitments.',
        },
        'price': '0.00',
        'currency': 'JOD',
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
        'price': '1.90',
        'currency': 'JOD',
        'prices': {
            'JOD': '1.90',
            'SAR': '9.99',
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
        'price': '9.50',
        'currency': 'JOD',
        'prices': {
            'JOD': '9.50',
            'SAR': '49.99',
            'USD': '13.33',
            'AED': '49.00',
            'EGP': '400.00',
            'EUR': '12.30',
            'TRY': '450.00',
        },
        'billing_period': Plan.BillingPeriod.MONTHLY,
        'duration_days': 30,
        'seats': 25,
        'extra_seat_price': '1.00',
        'level': 2,
        'features': [
            {'ar': 'كل ميزات الخطة الاحترافية', 'en': 'All Professional plan features'},
            {'ar': 'حسابات متعددة للمعلمين', 'en': 'Multiple teacher accounts'},
            {'ar': '25 مقعداً للمعلمين + مقاعد إضافية', 'en': '25 teacher seats + extra seats'},
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
        'price': '38.00',
        'currency': 'JOD',
        'prices': {
            'JOD': '38.00',
            'SAR': '199.00',
            'USD': '53.00',
            'AED': '195.00',
            'EGP': '1600.00',
            'EUR': '49.00',
            'TRY': '1800.00',
        },
        'billing_period': Plan.BillingPeriod.YEARLY,
        'duration_days': 365,
        'seats': 100,
        'extra_seat_price': '2.00',
        'level': 3,
        'features': [
            {'ar': 'كل ميزات خطة المدارس', 'en': 'All School plan features'},
            {'ar': '100 مقعداً للمعلمين + مقاعد إضافية', 'en': '100 teacher seats + extra seats'},
            {'ar': 'مستخدمون متعددون حسب الاتفاق', 'en': 'Multiple users by agreement'},
            {'ar': 'تكامل API', 'en': 'API integration'},
            {'ar': 'تخصيص المنصة', 'en': 'Platform customization'},
        ],
        'sort_order': 4,
    },
]


def main():
    created, updated = 0, 0
    for data in CURRENCIES:
        code = data['code']
        _, was_created = Currency.objects.update_or_create(code=code, defaults=data)
        if was_created:
            created += 1
        else:
            updated += 1
        print(f"  • currency {code}: {'created' if was_created else 'updated'}")
    print(f"  • currencies: {Currency.objects.count()} total")
    for data in PLANS:
        code = data['code']
        _, was_created = Plan.objects.update_or_create(code=code, defaults=data)
        if was_created:
            created += 1
        else:
            updated += 1
        print(f"  • {code}: {'created' if was_created else 'updated'}")
    for data in SERVICES:
        PlanService.objects.update_or_create(code=data['code'], defaults=data)
    print(f"  • services: {len(SERVICES)} catalog entries synced")
    free_plan = Plan.objects.filter(code='free').first()
    if free_plan:
        for data in FREE_LIMITS:
            service = PlanService.objects.filter(code=data['service_code']).first()
            if service:
                PlanServiceLimit.objects.update_or_create(
                    plan=free_plan,
                    service=service,
                    defaults={'limit': data['limit'], 'period': data['period'], 'sort_order': data['sort_order']},
                )
        print("  • free plan limits synced")
    print(f"Done — {created} created, {updated} updated, {Plan.objects.count()} plans total.")


if __name__ == '__main__':
    main()

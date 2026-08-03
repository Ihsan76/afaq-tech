from django.db import migrations

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
        'billing_period': 'monthly',
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
        'billing_period': 'monthly',
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
        'billing_period': 'monthly',
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
        'billing_period': 'yearly',
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


def seed_plans(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    for data in PLANS:
        Plan.objects.update_or_create(code=data['code'], defaults=data)


def unseed_plans(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    Plan.objects.filter(code__in=[p['code'] for p in PLANS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_plans, unseed_plans),
    ]

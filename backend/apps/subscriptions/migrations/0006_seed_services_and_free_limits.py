from django.db import migrations


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


def seed_services(apps, schema_editor):
    PlanService = apps.get_model('subscriptions', 'PlanService')
    for data in SERVICES:
        PlanService.objects.update_or_create(code=data['code'], defaults=data)


def seed_free_plan_limits(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    PlanService = apps.get_model('subscriptions', 'PlanService')
    PlanServiceLimit = apps.get_model('subscriptions', 'PlanServiceLimit')
    plan = Plan.objects.filter(code='free').first()
    if not plan:
        return
    for data in FREE_LIMITS:
        service = PlanService.objects.filter(code=data['service_code']).first()
        if not service:
            continue
        PlanServiceLimit.objects.update_or_create(
            plan=plan,
            service=service,
            defaults={'limit': data['limit'], 'period': data['period'], 'sort_order': data['sort_order']},
        )


def unseed_services(apps, schema_editor):
    PlanService = apps.get_model('subscriptions', 'PlanService')
    PlanService.objects.filter(code__in=[s['code'] for s in SERVICES]).delete()


def unseed_free_plan_limits(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    PlanService = apps.get_model('subscriptions', 'PlanService')
    PlanServiceLimit = apps.get_model('subscriptions', 'PlanServiceLimit')
    plan = Plan.objects.filter(code='free').first()
    if not plan:
        return
    PlanServiceLimit.objects.filter(plan=plan).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0005_planservice_planservicelimit_serviceusage'),
    ]

    operations = [
        migrations.RunPython(seed_services, unseed_services),
        migrations.RunPython(seed_free_plan_limits, unseed_free_plan_limits),
    ]

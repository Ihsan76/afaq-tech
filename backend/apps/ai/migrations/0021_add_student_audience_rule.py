from django.db import migrations

AUDIENCE_RULE = (
    "\n\nقاعدة مهمة:\n"
    "- الجمهور المستهدف هم الطلاب فقط. أشر إليهم دائماً بكلمة «الطلاب»، "
    "ولا تستخدم أبداً كلمات مثل «زبائن» أو «عملاء» أو «المستخدمون» للإشارة إلى الطلاب."
)

FEATURE_KEYS = ['lesson_plan', 'refine', 'worksheet', 'homework']


def add_audience_rule(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    for template in PromptTemplate.objects.filter(
        feature_key__in=FEATURE_KEYS,
        language='ar',
        is_default=True,
        is_active=True,
    ):
        if 'قاعدة مهمة' not in (template.template_body or ''):
            template.template_body = (template.template_body or '') + AUDIENCE_RULE
            template.save(update_fields=['template_body'])


def reverse_rule(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    for template in PromptTemplate.objects.filter(
        feature_key__in=FEATURE_KEYS,
        language='ar',
        is_default=True,
    ):
        body = template.template_body or ''
        if AUDIENCE_RULE in body:
            template.template_body = body.replace(AUDIENCE_RULE, '')
            template.save(update_fields=['template_body'])


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0020_fix_ar_worksheet_homework_templates'),
    ]

    operations = [
        migrations.RunPython(add_audience_rule, reverse_rule),
    ]

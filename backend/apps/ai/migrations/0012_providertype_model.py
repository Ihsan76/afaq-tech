from django.db import migrations, models


PROVIDER_TYPES = [
    {'code': 'google', 'name_ar': 'Google Gemini', 'name_en': 'Google Gemini', 'needs_base_url': False, 'default_base_url': '', 'needs_api_key': True, 'supports_fetching': True, 'sort_order': 1},
    {'code': 'openai', 'name_ar': 'OpenAI', 'name_en': 'OpenAI', 'needs_base_url': False, 'default_base_url': '', 'needs_api_key': True, 'supports_fetching': True, 'sort_order': 2},
    {'code': 'anthropic', 'name_ar': 'Anthropic (Claude)', 'name_en': 'Anthropic (Claude)', 'needs_base_url': False, 'default_base_url': '', 'needs_api_key': True, 'supports_fetching': False, 'sort_order': 3},
    {'code': 'ollama', 'name_ar': 'Ollama', 'name_en': 'Ollama', 'needs_base_url': True, 'default_base_url': 'http://localhost:11434', 'needs_api_key': False, 'supports_fetching': True, 'sort_order': 4},
    {'code': 'openai_compatible', 'name_ar': 'OpenAI Compatible', 'name_en': 'OpenAI Compatible', 'needs_base_url': True, 'default_base_url': '', 'needs_api_key': False, 'supports_fetching': True, 'sort_order': 5},
]


def seed_provider_types(apps, schema_editor):
    ProviderType = apps.get_model('ai', 'ProviderType')
    for pt in PROVIDER_TYPES:
        ProviderType.objects.get_or_create(code=pt['code'], defaults=pt)


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0011_add_ollama_and_openai_compatible'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProviderType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(help_text='e.g. google, openai, ollama', max_length=50, unique=True, verbose_name='الرمز')),
                ('name_ar', models.CharField(max_length=100, verbose_name='الاسم (عربي)')),
                ('name_en', models.CharField(max_length=100, verbose_name='الاسم (إنجليزي)')),
                ('needs_base_url', models.BooleanField(default=False, verbose_name='يتطلب رابط API')),
                ('default_base_url', models.CharField(blank=True, default='', max_length=500, verbose_name='الرابط الافتراضي')),
                ('needs_api_key', models.BooleanField(default=True, verbose_name='يتطلب مفتاح API')),
                ('supports_fetching', models.BooleanField(default=True, verbose_name='يدعم جلب النماذج')),
                ('sort_order', models.IntegerField(default=0, verbose_name='ترتيب')),
                ('is_active', models.BooleanField(default=True, verbose_name='مفعل')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')),
            ],
            options={
                'verbose_name': 'نوع المزود',
                'verbose_name_plural': 'أنواع المزودين',
                'ordering': ['sort_order', 'name_ar'],
            },
        ),
        migrations.RunPython(seed_provider_types, reverse_code=migrations.RunPython.noop),
        migrations.AlterField(
            model_name='aimodel',
            name='provider',
            field=models.CharField(db_index=True, max_length=50, verbose_name='المزود'),
        ),
        migrations.AlterField(
            model_name='aiprovider',
            name='base_url',
            field=models.CharField(blank=True, default='', max_length=500, verbose_name='رابط API'),
        ),
    ]

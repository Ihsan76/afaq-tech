from django.db import migrations
from django.conf import settings
from apps.ai.utils import encrypt_api_key


def seed_default_provider(apps, schema_editor):
    AIProvider = apps.get_model('ai', 'AIProvider')
    if AIProvider.objects.filter(provider_type='google').exists():
        return
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        return
    AIProvider.objects.create(
        name='Google Gemini (افتراضي)',
        provider_type='google',
        encrypted_api_key=encrypt_api_key(api_key),
        is_active=True,
    )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('ai', '0007_migrate_name_desc_to_json'),
    ]

    operations = [
        migrations.RunPython(seed_default_provider, reverse_code=migrations.RunPython.noop),
    ]

from django.db import migrations

def update_openai_compatible(apps, schema_editor):
    ProviderType = apps.get_model('ai', 'ProviderType')
    ProviderType.objects.filter(code='openai_compatible').update(needs_api_key=True)

class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0018_seed_more_prompt_templates'),
    ]

    operations = [
        migrations.RunPython(update_openai_compatible),
    ]

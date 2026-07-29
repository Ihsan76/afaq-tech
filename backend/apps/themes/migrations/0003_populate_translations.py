from django.db import migrations


def forwards(apps, schema_editor):
    Theme = apps.get_model('themes', 'Theme')
    for t in Theme.objects.all():
        t.translations = {
            "en": {"name": t.name or '', "description": t.description or ''},
            "ar": {"name": t.name_ar or '', "description": t.description_ar or ''},
        }
        t.save(update_fields=['translations'])


class Migration(migrations.Migration):

    dependencies = [
        ('themes', '0002_translations_add'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]

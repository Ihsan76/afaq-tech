from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model('users', 'User')
    for user in User.objects.all():
        user.translations = {
            "en": {"name": user.name_en or ''},
            "ar": {"name": user.name_ar or ''},
        }
        user.save(update_fields=['translations'])


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_translations_add'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]

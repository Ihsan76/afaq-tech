from django.db import migrations


def forwards(apps, schema_editor):
    Grade = apps.get_model('academics', 'Grade')
    for g in Grade.objects.all():
        g.translations = {
            "en": {"name": g.name_en or ''},
            "ar": {"name": g.name_ar or ''},
        }
        g.save(update_fields=['translations'])

    Subject = apps.get_model('academics', 'Subject')
    for s in Subject.objects.all():
        s.translations = {
            "en": {"name": s.name_en or ''},
            "ar": {"name": s.name_ar or ''},
        }
        s.save(update_fields=['translations'])

    Curriculum = apps.get_model('academics', 'Curriculum')
    for c in Curriculum.objects.all():
        c.translations = {
            "en": {"name": c.name_en or ''},
            "ar": {"name": c.name_ar or ''},
        }
        c.save(update_fields=['translations'])

    Unit = apps.get_model('academics', 'Unit')
    for u in Unit.objects.all():
        u.translations = {
            "en": {"name": u.name_en or ''},
            "ar": {"name": u.name_ar or ''},
        }
        u.save(update_fields=['translations'])


class Migration(migrations.Migration):

    dependencies = [
        ('academics', '0002_translations_add'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]

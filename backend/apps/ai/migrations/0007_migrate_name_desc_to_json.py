from django.db import migrations


def migrate_name_desc(apps, schema_editor):
    AIModel = apps.get_model('ai', 'AIModel')
    for obj in AIModel.objects.all():
        name = {}
        desc = {}
        if obj.name_ar:
            name['ar'] = obj.name_ar
            desc['ar'] = obj.description_ar or ''
        if obj.name_en:
            name['en'] = obj.name_en
            desc['en'] = obj.description_en or ''
        obj.name = name
        obj.description = desc
        obj.save(update_fields=['name', 'description'])


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0006_aimodel_json_fields'),
    ]

    operations = [
        migrations.RunPython(migrate_name_desc, reverse_code=migrations.RunPython.noop),
    ]

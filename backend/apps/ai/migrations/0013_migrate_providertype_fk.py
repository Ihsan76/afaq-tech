import django.db.models.deletion
from django.db import migrations, models


def map_charfield_to_fk(apps, schema_editor):
    ProviderType = apps.get_model('ai', 'ProviderType')
    AIProvider = apps.get_model('ai', 'AIProvider')
    for provider in AIProvider.objects.all():
        pt = ProviderType.objects.filter(code=provider.provider_type).first()
        if pt:
            provider.provider_type_new = pt
            provider.save(update_fields=['provider_type_new'])


class Migration(migrations.Migration):

    dependencies = [
        ('ai', '0012_providertype_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='aiprovider',
            name='provider_type_new',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='providers', to='ai.providertype', verbose_name='نوع المزود'),
        ),
        migrations.RunPython(map_charfield_to_fk, reverse_code=migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='aiprovider',
            name='provider_type',
        ),
        migrations.RenameField(
            model_name='aiprovider',
            old_name='provider_type_new',
            new_name='provider_type',
        ),
    ]

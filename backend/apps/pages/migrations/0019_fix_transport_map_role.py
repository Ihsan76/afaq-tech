from django.db import migrations


def fix_transport_map_role(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    item = MenuItem.objects.filter(menu="sidebar", url="/school/transport/map").first()
    if item:
        item.required_role = ["school_transport_officer"]
        item.save(update_fields=["required_role"])


def revert_transport_map_role(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    item = MenuItem.objects.filter(menu="sidebar", url="/school/transport/map").first()
    if item:
        item.required_role = ["school_admin"]
        item.save(update_fields=["required_role"])


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0018_seed_devices_transport_menu_items"),
    ]

    operations = [
        migrations.RunPython(fix_transport_map_role, revert_transport_map_role),
    ]

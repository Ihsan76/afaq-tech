from django.db import migrations

NEW_SCHOOL_ADMIN_ITEMS = [
    (19, "/school/fees", "💳", {"ar": {"title": "الرسوم والذمم"}, "en": {"title": "Fees & Accounts"}}),
    (20, "/school/transport", "🚌", {"ar": {"title": "النقل والحافلات"}, "en": {"title": "Transport"}}),
    (21, "/school/admin/devices", "🖥️", {"ar": {"title": "إدارة الأجهزة"}, "en": {"title": "Devices"}}),
    (22, "/school/transport/map", "🗺️", {"ar": {"title": "تتبع الحافلات"}, "en": {"title": "Live Tracking"}}),
    (23, "/school/admin/staff", "👥", {"ar": {"title": "الموظفون"}, "en": {"title": "Staff"}}),
    (24, "/school/admin/settings", "⚙️", {"ar": {"title": "الإعدادات"}, "en": {"title": "Settings"}}),
    (25, "/school/admin/transfer", "🔄", {"ar": {"title": "النقل والتحويل"}, "en": {"title": "Transfer"}}),
    (26, "/school/admin/year-cycle", "📅", {"ar": {"title": "السنة الدراسية"}, "en": {"title": "Year Cycle"}}),
]

NEW_DRIVER_ITEMS = [
    (10, "/school/driver", "🚌", {"ar": {"title": "لوحة السائق"}, "en": {"title": "Driver Dashboard"}}),
]


def seed_items(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    for order, url, icon, translations in NEW_SCHOOL_ADMIN_ITEMS:
        item, _ = MenuItem.objects.get_or_create(
            menu="sidebar",
            url=url,
            required_role=["school_admin"],
            defaults={
                "service_context": ["school"],
                "icon": icon,
                "order": order,
                "translations": translations,
                "is_active": True,
                "open_in_new": False,
            },
        )
        item.service_context = ["school"]
        item.icon = icon
        item.order = order
        item.translations = translations
        item.is_active = True
        item.open_in_new = False
        item.save()

    for order, url, icon, translations in NEW_DRIVER_ITEMS:
        item, _ = MenuItem.objects.get_or_create(
            menu="sidebar",
            url=url,
            required_role=["school_transport_officer"],
            defaults={
                "service_context": ["school"],
                "icon": icon,
                "order": order,
                "translations": translations,
                "is_active": True,
                "open_in_new": False,
            },
        )
        item.service_context = ["school"]
        item.icon = icon
        item.order = order
        item.translations = translations
        item.is_active = True
        item.open_in_new = False
        item.save()


def unseed_items(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    admin_urls = [url for (_, url, _, _) in NEW_SCHOOL_ADMIN_ITEMS]
    driver_urls = [url for (_, url, _, _) in NEW_DRIVER_ITEMS]
    MenuItem.objects.filter(
        menu="sidebar", url__in=admin_urls, required_role=["school_admin"]
    ).delete()
    MenuItem.objects.filter(
        menu="sidebar", url__in=driver_urls, required_role=["school_transport_officer"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0017_alter_menuitem_required_role"),
    ]

    operations = [
        migrations.RunPython(seed_items, unseed_items),
    ]

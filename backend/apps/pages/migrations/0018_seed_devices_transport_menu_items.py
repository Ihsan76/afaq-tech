from django.db import migrations

# Only NEW items that don't already exist in the sidebar.
# /school/fees and /school/transport already exist with broader roles.
NEW_SCHOOL_ADMIN_ITEMS = [
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
        existing = MenuItem.objects.filter(menu="sidebar", url=url).first()
        if existing:
            existing.order = order
            existing.icon = icon
            existing.translations = translations
            existing.is_active = True
            if "school_admin" not in (existing.required_role or []):
                existing.required_role = list(existing.required_role or []) + ["school_admin"]
            if "school" not in (existing.service_context or []):
                existing.service_context = list(existing.service_context or []) + ["school"]
            existing.save()
        else:
            MenuItem.objects.create(
                menu="sidebar",
                url=url,
                icon=icon,
                order=order,
                translations=translations,
                is_active=True,
                open_in_new=False,
                required_role=["school_admin"],
                service_context=["school"],
            )

    for order, url, icon, translations in NEW_DRIVER_ITEMS:
        existing = MenuItem.objects.filter(menu="sidebar", url=url).first()
        if existing:
            existing.order = order
            existing.icon = icon
            existing.translations = translations
            existing.is_active = True
            if "school_transport_officer" not in (existing.required_role or []):
                existing.required_role = list(existing.required_role or []) + ["school_transport_officer"]
            if "school" not in (existing.service_context or []):
                existing.service_context = list(existing.service_context or []) + ["school"]
            existing.save()
        else:
            MenuItem.objects.create(
                menu="sidebar",
                url=url,
                icon=icon,
                order=order,
                translations=translations,
                is_active=True,
                open_in_new=False,
                required_role=["school_transport_officer"],
                service_context=["school"],
            )


def unseed_items(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    admin_urls = [url for (_, url, _, _) in NEW_SCHOOL_ADMIN_ITEMS]
    driver_urls = [url for (_, url, _, _) in NEW_DRIVER_ITEMS]
    # Only remove items we created (with these specific roles)
    MenuItem.objects.filter(menu="sidebar", url__in=admin_urls, required_role=["school_admin"]).delete()
    MenuItem.objects.filter(menu="sidebar", url__in=driver_urls, required_role=["school_transport_officer"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0017_alter_menuitem_required_role"),
    ]

    operations = [
        migrations.RunPython(seed_items, unseed_items),
    ]

from django.db import migrations

SCHOOL_ADMIN_ITEMS = [
    (10, "/school/admin", "📊", {"ar": {"title": "لوحة المؤشرات"}, "en": {"title": "Dashboard"}}),
    (11, "/school/admin/grades", "📚", {"ar": {"title": "الصفوف"}, "en": {"title": "Grades"}}),
    (12, "/school/admin/teachers", "👨‍🏫", {"ar": {"title": "المعلمون"}, "en": {"title": "Teachers"}}),
    (13, "/school/admin/rooms", "🚪", {"ar": {"title": "القاعات"}, "en": {"title": "Rooms"}}),
    (14, "/school/admin/sections", "🏫", {"ar": {"title": "الشعب والطلاب"}, "en": {"title": "Sections & Students"}}),
    (15, "/school/admin/timetable", "📅", {"ar": {"title": "الجداول والبرامج"}, "en": {"title": "Timetables"}}),
    (16, "/school/admin/attendance", "🚨", {"ar": {"title": "الحضور والغياب"}, "en": {"title": "Attendance"}}),
    (17, "/school/admin/announcements", "📢", {"ar": {"title": "الإعلانات والطوارئ"}, "en": {"title": "Announcements"}}),
    (18, "/school/admin/tickets", "💬", {"ar": {"title": "التذاكر والمرفقات"}, "en": {"title": "Tickets & Files"}}),
]


def seed_school_admin_menu(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    for order, url, icon, translations in SCHOOL_ADMIN_ITEMS:
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


def unseed_school_admin_menu(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    urls = [url for (_, url, _, _) in SCHOOL_ADMIN_ITEMS]
    MenuItem.objects.filter(
        menu="sidebar", url__in=urls, required_role=["school_admin"]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0015_alter_menuitem_required_role_and_more"),
    ]

    operations = [
        migrations.RunPython(seed_school_admin_menu, unseed_school_admin_menu),
    ]

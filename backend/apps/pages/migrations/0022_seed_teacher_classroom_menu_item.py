from django.db import migrations


TRANSLATIONS = {
    "ar": {
        "title": "Google Classroom",
        "description": "ربط ومزامنة دورات Google Classroom مع المنصة",
    },
    "en": {
        "title": "Google Classroom",
        "description": "Connect and sync your Google Classroom courses",
    },
    "fr": {
        "title": "Google Classroom",
        "description": "Connectez et synchronisez vos cours Google Classroom",
    },
    "tr": {
        "title": "Google Classroom",
        "description": "Google Classroom derslerinizi platformla senkronize edin",
    },
    "ur": {
        "title": "Google Classroom",
        "description": "اپنے Google Classroom کورسز کو مربوط اور مطابقت پذیر کریں",
    },
    "es": {
        "title": "Google Classroom",
        "description": "Conecte y sincronice sus cursos de Google Classroom",
    },
    "de": {
        "title": "Google Classroom",
        "description": "Verbinden und synchronisieren Sie Ihre Google Classroom Kurse",
    },
    "id": {
        "title": "Google Classroom",
        "description": "Hubungkan dan sinkronkan kursus Google Classroom Anda",
    },
    "bn": {
        "title": "Google Classroom",
        "description": "আপনার Google Classroom কোর্স সংযুক্ত এবং সিঙ্ক করুন",
    },
    "fa": {
        "title": "Google Classroom",
        "description": "اتصال و هماهنگ‌سازی دوره‌های Google Classroom شما",
    },
}


def forwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")

    url = "/teacher/classroom"
    existing = MenuItem.objects.filter(menu="sidebar", url=url).first()

    if existing:
        return

    MenuItem.objects.create(
        menu="sidebar",
        url=url,
        icon="📚",
        order=420,
        is_active=True,
        service_context=["school"],
        required_role=["teacher"],
        translations=TRANSLATIONS,
    )


def backwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    MenuItem.objects.filter(
        menu="sidebar", url="/teacher/classroom"
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0021_seed_google_classroom_menu_item"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

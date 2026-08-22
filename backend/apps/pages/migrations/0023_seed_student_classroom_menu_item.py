from django.db import migrations


TRANSLATIONS = {
    "ar": {
        "title": "Google Classroom",
        "description": "عرض دوراتك وواجباتك ودرجاتك في Google Classroom",
    },
    "en": {
        "title": "Google Classroom",
        "description": "View your Google Classroom courses, assignments, and grades",
    },
    "fr": {
        "title": "Google Classroom",
        "description": "Consultez vos cours, devoirs et notes Google Classroom",
    },
    "tr": {
        "title": "Google Classroom",
        "description": "Google Classroom derslerinizi, ödevlerinizi ve notlarınızı görüntüleyin",
    },
    "ur": {
        "title": "Google Classroom",
        "description": "اپنے Google Classroom کورسز، مشاقیں اور گریڈز دیکھیں",
    },
    "es": {
        "title": "Google Classroom",
        "description": "Vea sus cursos, tareas y calificaciones de Google Classroom",
    },
    "de": {
        "title": "Google Classroom",
        "description": "Zeigen Sie Ihre Google Classroom Kurse, Aufgaben und Noten an",
    },
    "id": {
        "title": "Google Classroom",
        "description": "Lihat kursus, tugas, dan nilai Google Classroom Anda",
    },
    "bn": {
        "title": "Google Classroom",
        "description": "আপনার Google Classroom কোর্স, অ্যাসাইনমেন্ট এবং গ্রেড দেখুন",
    },
    "fa": {
        "title": "Google Classroom",
        "description": "دوره‌ها، تکالیف و نمرات Google Classroom خود را مشاهده کنید",
    },
}


def forwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")

    url = "/student/classroom"
    existing = MenuItem.objects.filter(menu="sidebar", url=url).first()

    if existing:
        return

    MenuItem.objects.create(
        menu="sidebar",
        url=url,
        icon="📖",
        order=430,
        is_active=True,
        service_context=["school"],
        required_role=["student"],
        translations=TRANSLATIONS,
    )


def backwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    MenuItem.objects.filter(
        menu="sidebar", url="/student/classroom"
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0022_seed_teacher_classroom_menu_item"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

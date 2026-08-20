from django.db import migrations


TRANSLATIONS = {
    "ar": {
        "title": "Google Classroom",
        "description": "ربط واستيراد وتصدير البيانات مع Google Classroom",
    },
    "en": {
        "title": "Google Classroom",
        "description": "Connect, import and export data with Google Classroom",
    },
    "fr": {
        "title": "Google Classroom",
        "description": "Connecter, importer et exporter des données avec Google Classroom",
    },
    "tr": {
        "title": "Google Classroom",
        "description": "Google Classroom ile veri bağlantısı, içe aktarma ve dışa aktarma",
    },
    "ur": {
        "title": "Google Classroom",
        "description": "Google Classroom کے ساتھ ڈیٹا کنیکٹ، درآمد اور برآمد",
    },
    "es": {
        "title": "Google Classroom",
        "description": "Conectar, importar y exportar datos con Google Classroom",
    },
    "de": {
        "title": "Google Classroom",
        "description": "Daten mit Google Classroom verbinden, importieren und exportieren",
    },
    "id": {
        "title": "Google Classroom",
        "description": "Menghubungkan, mengimpor dan mengekspor data dengan Google Classroom",
    },
    "bn": {
        "title": "Google Classroom",
        "description": "Google Classroom এর সাথে ডেটা সংযোগ, আমদানি এবং রপ্তানি",
    },
    "fa": {
        "title": "Google Classroom",
        "description": "اتصال، واردات و صادرات داده با Google Classroom",
    },
}


def forwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")

    url = "/school/admin/google-classroom"
    existing = MenuItem.objects.filter(menu="sidebar", url=url).first()

    if existing:
        return

    MenuItem.objects.create(
        menu="sidebar",
        url=url,
        icon="🔗",
        order=410,
        is_active=True,
        service_context=["school"],
        required_role=["school_admin", "admin", "developer"],
        translations=TRANSLATIONS,
    )


def backwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    MenuItem.objects.filter(
        menu="sidebar", url="/school/admin/google-classroom"
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0020_seed_device_integration_menu_item"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

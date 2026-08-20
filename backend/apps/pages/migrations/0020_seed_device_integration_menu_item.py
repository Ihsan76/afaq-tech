from django.db import migrations


TRANSLATIONS = {
    "ar": {
        "title": "ربط الأجهزة الذكية",
        "description": "دليل شامل لعملية ربط وتهيئة الأجهزة الذكية بالمنصة",
    },
    "en": {
        "title": "Device Integration Guide",
        "description": "Complete guide for integrating smart devices with the platform",
    },
    "fr": {
        "title": "Guide d'intégration des appareils",
        "description": "Guide complet pour intégrer les appareils intelligents à la plateforme",
    },
    "tr": {
        "title": "Cihaz Entegrasyonu Rehberi",
        "description": "Akıllı cihazların platforma entegrasyonu için kapsamlı rehber",
    },
    "ur": {
        "title": "ڈیوائس انٹیگریشن گائیڈ",
        "description": "پلیٹ فارم کے ساتھ اسمارٹ ڈیوائسز کو جوڑنے کا مکمل گائیڈ",
    },
    "es": {
        "title": "Guía de integración de dispositivos",
        "description": "Guía completa para integrar dispositivos inteligentes en la plataforma",
    },
    "de": {
        "title": "Geräte-Integrationsleitfaden",
        "description": "Vollständiger Leitfaden zur Integration intelligenter Geräte in die Plattform",
    },
    "id": {
        "title": "Panduan Integrasi Perangkat",
        "description": "Panduan lengkap integrasi perangkat pintar ke platform",
    },
    "bn": {
        "title": "ডিভাইস ইন্টিগ্রেশন গাইড",
        "description": "প্ল্যাটফর্মে স্মার্ট ডিভাইস ইন্টিগ্রেশনের সম্পূর্ণ গাইড",
    },
    "fa": {
        "title": "راهنمای یکپارچه‌سازی دستگاه‌ها",
        "description": "راهنمای جامع یکپارچه‌سازی دستگاه‌های هوشمند با پلتفرم",
    },
}


def forwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")

    url = "/school/admin/device-integration"
    existing = MenuItem.objects.filter(menu="sidebar", url=url).first()

    if existing:
        return

    MenuItem.objects.create(
        menu="sidebar",
        url=url,
        icon="📖",
        order=400,
        is_active=True,
        service_context=["school"],
        required_role=["school_admin", "admin", "developer"],
        translations=TRANSLATIONS,
    )


def backwards(apps, schema_editor):
    MenuItem = apps.get_model("pages", "MenuItem")
    MenuItem.objects.filter(
        menu="sidebar", url="/school/admin/device-integration"
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("pages", "0019_fix_transport_map_role"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

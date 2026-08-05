from django.db import migrations

AUDIENCE_RULES = {
    'en': (
        "\n\nImportant rule:\n"
        "- The target audience is students only. Always refer to them as \"students\". "
        "Never use words like \"customers\", \"clients\", or \"users\" to refer to students."
    ),
    'fr': (
        "\n\nRègle importante :\n"
        "- Le public cible est uniquement les élèves. Référez-vous toujours à eux comme « élèves ». "
        "N'utilisez jamais des mots comme « clients » ou « utilisateurs » pour désigner les élèves."
    ),
    'tr': (
        "\n\nÖnemli kural:\n"
        "- Hedef kitle yalnızca öğrencilerdir. Onlara her zaman « öğrenciler » olarak hitap edin. "
        "Öğrencileri ifade etmek için asla « müşteriler » veya « kullanıcılar » gibi kelimeler kullanmayın."
    ),
    'ur': (
        "\n\nاہم قاعدہ:\n"
        "- ہدف سامعین صرف طلباء ہیں۔ ہمیشہ انہیں «طلباء» کہہ کر مخاطب کریں۔ "
        "طلباء کے لیے کبھی «گاہک» یا «صارفین» جیسے الفاظ استعمال نہ کریں۔"
    ),
    'es': (
        "\n\nRegla importante:\n"
        "- El público objetivo son únicamente los estudiantes. Refiérase siempre a ellos como «estudiantes». "
        "Nunca use palabras como «clientes» o «usuarios» para referirse a los estudiantes."
    ),
    'de': (
        "\n\nWichtige Regel:\n"
        "- Die Zielgruppe sind ausschließlich Schülerinnen und Schüler. Bezeichnen Sie sie immer als «Schülerinnen und Schüler». "
        "Verwenden Sie niemals Wörter wie «Kunden» oder «Benutzer», um sich auf Schüler zu beziehen."
    ),
    'id': (
        "\n\nAturan penting:\n"
        "- Target audiens adalah siswa saja. Selalu sebut mereka sebagai «siswa». "
        "Jangan pernah menggunakan kata seperti «pelanggan» atau «pengguna» untuk merujuk pada siswa."
    ),
    'bn': (
        "\n\nগুরুত্বপূর্ণ নিয়ম:\n"
        "- লক্ষ্য শ্রোতা শুধুমাত্র শিক্ষার্থীরা। তাদের সর্বদা «শিক্ষার্থী» বলে সম্বোধন করুন। "
        "শিক্ষার্থীদের বোঝাতে «গ্রাহক» বা «ব্যবহারকারী» এর মতো শব্দ কখনও ব্যবহার করবেন না।"
    ),
}

FEATURE_KEYS = ['lesson_plan', 'refine', 'worksheet', 'homework']


def add_audience_rules(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    for lang, rule in AUDIENCE_RULES.items():
        for template in PromptTemplate.objects.filter(
            feature_key__in=FEATURE_KEYS,
            language=lang,
            is_active=True,
        ):
            body = template.template_body or ''
            marker = rule.strip().split('\n')[0]
            if marker not in body:
                template.template_body = body + rule
                template.save(update_fields=['template_body'])


def reverse_rules(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    for lang, rule in AUDIENCE_RULES.items():
        for template in PromptTemplate.objects.filter(
            feature_key__in=FEATURE_KEYS,
            language=lang,
        ):
            body = template.template_body or ''
            if rule in body:
                template.template_body = body.replace(rule, '')
                template.save(update_fields=['template_body'])


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0021_add_student_audience_rule'),
    ]

    operations = [
        migrations.RunPython(add_audience_rules, reverse_rules),
    ]

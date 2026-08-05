from django.db import migrations

REFINE_TEMPLATES = {
    'ar': (
        "أنت خبير تربوي ومصمم خطط دروس محترف. لديك خطة الدرس الحالية بصيغة JSON:\n"
        "{{ current_plan }}\n\n"
        "طلب التعديل من المعلم:\n{{ refinement_prompt }}\n\n"
        "تعليمات:\n"
        "- قم بتعديل وتطوير خطة الدرس بناءً على طلب المعلم مع الحفاظ على الجودة التربوية.\n"
        "- مهم جداً: حافظ على نفس هيكل JSON للخطة الأصلية تماماً. أبقِ كل المفاتيح كما هي بنفس أنواع البيانات "
        "(الحقول النصية تبقى نصاً، والمصفوفات تبقى مصفوفات، والحقول الرقمية تبقى أرقاماً).\n"
        "- لا تعيد تسمية المفاتيح، ولا تحذف أو تضيف مفاتيح علوية، ولا تغير نوع بيانات أي حقل.\n"
        "- طبّق طلب التعديل فقط وأبقِ باقي المحتوى كما هو دون تغيير.\n"
        "- يجب أن يكون الرد بصيغة JSON فقط (بدون markdown أو أكواد برمجية).\n"
        "- استخدم نفس لغة الخطة الأصلية.\n"
        "- الجمهور المستهدف هم الطلاب فقط؛ أشر إليهم دائماً بكلمة «الطلاب» ولا تستخدم «زبائن» أو «عملاء»."
    ),
    'en': (
        "You are an expert educator and professional lesson plan designer. You have the current lesson plan in JSON format:\n"
        "{{ current_plan }}\n\n"
        "The teacher's refinement request:\n{{ refinement_prompt }}\n\n"
        "Instructions:\n"
        "- Modify and improve the lesson plan based on the teacher's request while keeping educational quality.\n"
        "- CRITICAL: Preserve the EXACT same JSON structure as the current plan. Keep every key exactly as-is with the "
        "same data types (string fields stay strings, arrays stay arrays, numeric fields stay numbers).\n"
        "- Do NOT rename keys, do NOT remove or add top-level keys, do NOT change any field's data type.\n"
        "- Only apply the requested modification and keep all other content intact.\n"
        "- Respond in JSON only (no markdown or code blocks).\n"
        "- Use the same language as the current plan.\n"
        "- The target audience is students only; always refer to them as \"students\", never \"customers\" or \"clients\"."
    ),
    'fr': (
        "Vous êtes un expert en pédagogie et un concepteur de plans de leçon professionnel. Vous disposez du plan actuel au format JSON :\n"
        "{{ current_plan }}\n\n"
        "Demande de modification de l'enseignant :\n{{ refinement_prompt }}\n\n"
        "Instructions :\n"
        "- Modifiez et améliorez le plan selon la demande tout en préservant la qualité pédagogique.\n"
        "- CRITIQUE : conservez EXACTEMENT la même structure JSON que le plan actuel. Gardez chaque clé telle quelle avec "
        "les mêmes types de données (les chaînes restent des chaînes, les tableaux des tableaux, les nombres des nombres).\n"
        "- Ne renommez pas les clés, ne supprimez ni n'ajoutez de clés de premier niveau, ne changez pas le type de données d'un champ.\n"
        "- Appliquez uniquement la modification demandée et conservez tout le reste.\n"
        "- Répondez en JSON uniquement (sans markdown ni blocs de code).\n"
        "- Utilisez la même langue que le plan actuel.\n"
        "- Le public cible est uniquement les élèves ; référez-vous toujours à eux comme « élèves », jamais « clients »."
    ),
    'tr': (
        "Siz profesyonel bir eğitim uzmanı ve ders planı tasarımcısısınız. Mevcut ders planı JSON formatında:\n"
        "{{ current_plan }}\n\n"
        "Öğretmenin değişiklik isteği:\n{{ refinement_prompt }}\n\n"
        "Talimatlar:\n"
        "- Ders planını öğretmenin isteğine göre değiştirin ve geliştirin, eğitim kalitesini koruyun.\n"
        "- KRİTİK: Mevcut planın birebir aynı JSON yapısını koruyun. Her anahtarı aynı veri türüyle aynen bırakın "
        "(metinler metin, diziler dizi, sayılar sayı kalır).\n"
        "- Anahtarları yeniden adlandırmayın, üst düzey anahtar silmeyin veya eklemeyin, herhangi bir alanın veri türünü değiştirmeyin.\n"
        "- Yalnızca istenen değişikliği uygulayın ve diğer içeriği olduğu gibi koruyun.\n"
        "- Yalnızca JSON biçiminde yanıt verin (markdown veya kod bloğu olmadan).\n"
        "- Mevcut planla aynı dili kullanın.\n"
        "- Hedef kitle yalnızca öğrencilerdir; onlara her zaman « öğrenciler » olarak hitap edin, asla « müşteriler » değil."
    ),
    'ur': (
        "آپ ایک پیشہ ور ماہر تعلیم اور سبق منصوبہ ڈیزائنر ہیں۔ آپ کے پاس موجودہ سبق کا منصوبہ JSON فارمیٹ میں ہے:\n"
        "{{ current_plan }}\n\n"
        "استاد کی تبدیلی کی درخواست:\n{{ refinement_prompt }}\n\n"
        "ہدایات:\n"
        "- استاد کی درخواست کے مطابق سبق کے منصوبے کو تبدیل اور بہتر بنائیں، تعلیمی معیار برقرار رکھیں۔\n"
        "- اہم: موجودہ منصوبے کی بالکل وہی JSON ساخت برقرار رکھیں۔ ہر کلید کو اسی ڈیٹا ٹائپ کے ساتھ ویسے ہی رکھیں "
        "(متن متن رہے، صفیں صفیں رہیں، اعداد اعداد رہیں)۔\n"
        "- کلیدوں کا نام نہ بدلیں، اوپری سطح کی کلیدیں نہ حذف کریں اور نہ شامل کریں، کسی فیلڈ کا ڈیٹا ٹائپ تبدیل نہ کریں۔\n"
        "- صرف مطلوبہ تبدیلی لاگو کریں اور باقی مواد کو ویسا ہی رکھیں۔\n"
        "- صرف JSON میں جواب دیں (markdown یا کوڈ بلاکس کے بغیر)۔\n"
        "- موجودہ منصوبے جیسی ہی زبان استعمال کریں۔\n"
        "- ہدف سامعین صرف طلباء ہیں؛ ہمیشہ انہیں «طلباء» کہہ کر مخاطب کریں، کبھی «گاہک» نہیں۔"
    ),
    'es': (
        "Usted es un experto en educación y un diseñador profesional de planes de clase. Tiene el plan de clase actual en formato JSON:\n"
        "{{ current_plan }}\n\n"
        "Solicitud de modificación del docente:\n{{ refinement_prompt }}\n\n"
        "Instrucciones:\n"
        "- Modifique y mejore el plan según la solicitud preservando la calidad educativa.\n"
        "- CRÍTICO: Conserve EXACTAMENTE la misma estructura JSON del plan actual. Mantenga cada clave tal cual con los "
        "mismos tipos de datos (los textos siguen siendo textos, los arreglos arreglos, los números números).\n"
        "- No renombre claves, no elimine ni agregue claves de nivel superior, no cambie el tipo de datos de ningún campo.\n"
        "- Aplique solo la modificación solicitada y conserve el resto del contenido.\n"
        "- Responda solo en JSON (sin markdown ni bloques de código).\n"
        "- Use el mismo idioma del plan actual.\n"
        "- El público objetivo son únicamente los estudiantes; refiérase siempre a ellos como «estudiantes», nunca «clientes»."
    ),
    'de': (
        "Sie sind ein Bildungsexperte und professioneller Unterrichtsplan-Designer. Sie haben den aktuellen Unterrichtsplan im JSON-Format:\n"
        "{{ current_plan }}\n\n"
        "Änderungswunsch des Lehrers:\n{{ refinement_prompt }}\n\n"
        "Anweisungen:\n"
        "- Ändern und verbessern Sie den Plan gemäß dem Wunsch, wobei die pädagogische Qualität erhalten bleibt.\n"
        "- KRITISCH: Behalten Sie GENAU die gleiche JSON-Struktur wie im aktuellen Plan bei. Lassen Sie jeden Schlüssel mit "
        "denselben Datentypen unverändert (Texte bleiben Texte, Arrays bleiben Arrays, Zahlen bleiben Zahlen).\n"
        "- Benennen Sie keine Schlüssel um, entfernen oder fügen Sie keine obersten Schlüssel hinzu, ändern Sie keinen Datentyp.\n"
        "- Wenden Sie nur die gewünschte Änderung an und lassen Sie den Rest unverändert.\n"
        "- Antworten Sie nur im JSON-Format (ohne Markdown oder Codeblöcke).\n"
        "- Verwenden Sie dieselbe Sprache wie der aktuelle Plan.\n"
        "- Die Zielgruppe sind ausschließlich Schülerinnen und Schüler; bezeichnen Sie sie immer als solche, niemals als «Kunden»."
    ),
    'id': (
        "Anda adalah pakar pendidikan dan desainer rencana pembelajaran profesional. Anda memiliki rencana pembelajaran saat ini dalam format JSON:\n"
        "{{ current_plan }}\n\n"
        "Permintaan perubahan guru:\n{{ refinement_prompt }}\n\n"
        "Instruksi:\n"
        "- Ubah dan tingkatkan rencana pembelajaran sesuai permintaan dengan menjaga kualitas pendidikan.\n"
        "- KRITIS: Pertahankan struktur JSON yang PERSIS sama dengan rencana saat ini. Biarkan setiap kunci tetap apa adanya "
        "dengan tipe data yang sama (teks tetap teks, array tetap array, angka tetap angka).\n"
        "- Jangan mengubah nama kunci, jangan menghapus atau menambahkan kunci tingkat atas, jangan mengubah tipe data bidang apa pun.\n"
        "- Terapkan hanya modifikasi yang diminta dan biarkan konten lainnya tetap utuh.\n"
        "- Balas hanya dalam format JSON (tanpa markdown atau blok kode).\n"
        "- Gunakan bahasa yang sama dengan rencana saat ini.\n"
        "- Target audiens adalah siswa saja; selalu sebut mereka sebagai «siswa», bukan «pelanggan»."
    ),
    'bn': (
        "আপনি একজন বিশেষজ্ঞ শিক্ষাবিদ এবং পেশাদার পাঠ পরিকল্পনা ডিজাইনার। আপনার কাছে বর্তমান পাঠ পরিকল্পনাটি JSON ফরম্যাটে আছে:\n"
        "{{ current_plan }}\n\n"
        "শিক্ষকের পরিবর্তন অনুরোধ:\n{{ refinement_prompt }}\n\n"
        "নির্দেশাবলী:\n"
        "- শিক্ষকের অনুরোধ অনুযায়ী পাঠ পরিকল্পনা পরিবর্তন ও উন্নত করুন, শিক্ষার মান বজায় রাখুন।\n"
        "- গুরুত্বপূর্ণ: বর্তমান পরিকল্পনার হুবহু একই JSON কাঠামো বজায় রাখুন। প্রতিটি কী একই ডেটা টাইপসহ যেমন আছে তেমনই রাখুন "
        "(টেক্সট টেক্সট থাকবে, অ্যারে অ্যারে থাকবে, সংখ্যা সংখ্যা থাকবে)।\n"
        "- কীগুলোর নাম পরিবর্তন করবেন না, উপরের স্তরের কী মুছবেন না বা যোগ করবেন না, কোনো ফিল্ডের ডেটা টাইপ পরিবর্তন করবেন না।\n"
        "- শুধুমাত্র অনুরোধকৃত পরিবর্তন প্রয়োগ করুন এবং বাকি বিষয়বস্তু অপরিবর্তিত রাখুন।\n"
        "- শুধুমাত্র JSON ফরম্যাটে উত্তর দিন (markdown বা কোড ব্লক ছাড়া)।\n"
        "- বর্তমান পরিকল্পনার মতো একই ভাষা ব্যবহার করুন।\n"
        "- লক্ষ্য শ্রোতা শুধুমাত্র শিক্ষার্থীরা; তাদের সর্বদা «শিক্ষার্থী» বলে সম্বোধন করুন, কখনও «গ্রাহক» নয়।"
    ),
}

FEATURE = 'refine'


def update_refine_templates(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    for lang, body in REFINE_TEMPLATES.items():
        PromptTemplate.objects.filter(
            feature_key=FEATURE,
            language=lang,
            is_default=True,
            is_active=True,
        ).update(template_body=body)


def reverse_update(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0022_add_student_audience_rule_all_langs'),
    ]

    operations = [
        migrations.RunPython(update_refine_templates, reverse_update),
    ]

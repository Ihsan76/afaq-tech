from django.core.management.base import BaseCommand
from apps.ai.models import CountryPromptProfile, GradePromptProfile, SubjectPromptProfile, PromptTemplate
from apps.academics.models import Grade, Subject

LOCALIZED_TEMPLATES = {
    'ar': {
        "name": "خطة الدرس المتقدمة (AR)",
        "body": "أنت معلم خبير ومصمم مناهج تعليمية معتمد. مهمتك إعداد خطة درس تفصيلية، دقيقة، ومنظمة.",
        "msg": "إطار الدولة: {{ country_framework }}\nالمادة: {{ subject }}\nالمرحلة: {{ grade }}\nعنوان الدرس: {{ title }}\nوصف الدرس: {{ prompt_text }}\n\nسياق المنهاج الرسمي:\n{{ curriculum_context }}\n\nقواعد المادة والعمق: {{ topic_rules }}\nتعليمات إضافية: {{ extra_instructions }}\n\nأجب بصيغة JSON فقط."
    },
    'en': {
        "name": "Advanced Lesson Plan (EN)",
        "body": "You are an expert educator and certified curriculum designer. Your task is to prepare a detailed, precise lesson plan.",
        "msg": "Country Framework: {{ country_framework }}\nSubject: {{ subject }}\nGrade: {{ grade }}\nLesson Title: {{ title }}\nDescription: {{ prompt_text }}\n\nCurriculum Context:\n{{ curriculum_context }}\n\nTopic Rules: {{ topic_rules }}\nExtra Instructions: {{ extra_instructions }}\n\nReturn JSON only."
    },
    'fr': {
        "name": "Plan de cours avancé (FR)",
        "body": "Vous êtes un éducateur expert et un concepteur de programmes certifié. Votre tâche est de préparer un plan de cours détaillé et précis.",
        "msg": "Cadre national : {{ country_framework }}\nMatière : {{ subject }}\nNiveau : {{ grade }}\nTitre de la leçon : {{ title }}\nDescription : {{ prompt_text }}\n\nContexte du programme :\n{{ curriculum_context }}\n\nRègles du sujet : {{ topic_rules }}\nInstructions supplémentaires : {{ extra_instructions }}\n\nRetourner uniquement en JSON."
    },
    'tr': {
        "name": "Gelişmiş Ders Planı (TR)",
        "body": "Uzman bir eğitimci ve sertifikalı müfredat tasarımcısın. Görevin ayrıntılı, hassas ve düzenli bir ders planı hazırlamak.",
        "msg": "Ülke Çerçevesi: {{ country_framework }}\nKonu: {{ subject }}\nSınıf: {{ grade }}\nDers Başlığı: {{ title }}\nAçıklama: {{ prompt_text }}\n\nMüfredat Bağlamı:\n{{ curriculum_context }}\n\nKonu Kuralları: {{ topic_rules }}\nEk Talimatlar: {{ extra_instructions }}\n\nSadece JSON döndür."
    },
    'ur': {
        "name": "اعلی درجے کا سبق کا منصوبہ (UR)",
        "body": "آپ ایک ماہر معلم اور مصدقہ نصاب ڈیزائنر ہیں۔ آپ کا کام ایک تفصیلی، درست اور منظم سبق کا منصوبہ تیار کرنا ہے۔",
        "msg": "ملکی فریم ورک: {{ country_framework }}\nموضوع: {{ subject }}\nگریڈ: {{ grade }}\nسبق کا عنوان: {{ title }}\nتفصیل: {{ prompt_text }}\n\nنصاب کا سیاق و سباق:\n{{ curriculum_context }}\n\nموضوع کے اصول: {{ topic_rules }}\nاضافی ہدایات: {{ extra_instructions }}\n\nصرف JSON واپس کریں۔"
    },
    'es': {
        "name": "Plan de lección avanzado (ES)",
        "body": "Eres un educador experto y un diseñador curricular certificado. Tu tarea es preparar un plan de lección detallado y preciso.",
        "msg": "Marco del país: {{ country_framework }}\nAsignatura: {{ subject }}\nGrado: {{ grade }}\nTítulo de la lección: {{ title }}\nDescripción: {{ prompt_text }}\n\nContexto del plan de estudios:\n{{ curriculum_context }}\n\nReglas del tema: {{ topic_rules }}\nInstrucciones adicionales: {{ extra_instructions }}\n\nDevolver solo JSON."
    },
    'de': {
        "name": "Erweiterter Unterrichtsentwurf (DE)",
        "body": "Sie sind ein erfahrener Pädagoge und zertifizierter Curriculum-Designer. Ihre Aufgabe ist es, einen detaillierten, präzisen Unterrichtsentwurf zu erstellen.",
        "msg": "Länderrahmen: {{ country_framework }}\nFach: {{ subject }}\nKlasse: {{ grade }}\nLektionstitel: {{ title }}\nBeschreibung: {{ prompt_text }}\n\nCurriculum-Kontext:\n{{ curriculum_context }}\n\nThemenregeln: {{ topic_rules }}\nZusätzliche Anweisungen: {{ extra_instructions }}\n\nNur JSON zurückgeben."
    },
    'id': {
        "name": "Rencana Pelajaran Lanjutan (ID)",
        "body": "Anda adalah pendidik ahli dan perancang kurikulum bersertifikat. Tugas Anda adalah menyiapkan rencana pelajaran yang terperinci dan tepat.",
        "msg": "Kerangka Negara: {{ country_framework }}\nSubjek: {{ subject }}\nKelas: {{ grade }}\nJudul Pelajaran: {{ title }}\nDeskripsi: {{ prompt_text }}\n\nKonteks Kurikulum:\n{{ curriculum_context }}\n\nAturan Topik: {{ topic_rules }}\nInstruksi Tambahan: {{ extra_instructions }}\n\nHanya kembalikan JSON."
    },
    'bn': {
        "name": "উন্নত পাঠ পরিকল্পনা (BN)",
        "body": "আপনি একজন বিশেষজ্ঞ শিক্ষাবিদ এবং প্রত্যয়িত পাঠ্যক্রম ডিজাইনার। আপনার কাজ একটি বিস্তারিত, সুনির্দিষ্ট পাঠ পরিকল্পনা প্রস্তুত করা।",
        "msg": "দেশের ফ্রেমওয়ার্ক: {{ country_framework }}\nবিষয়: {{ subject }}\nগ্রেড: {{ grade }}\nপাঠের শিরোনাম: {{ title }}\nবর্ণনা: {{ prompt_text }}\n\nপাঠ্যক্রমের প্রসঙ্গ:\n{{ curriculum_context }}\n\nবিষয়ের নিয়ম: {{ topic_rules }}\nঅতিরিক্ত নির্দেশাবলী: {{ extra_instructions }}\n\nশুধুমাত্র JSON প্রদান করুন।"
    },
    'fa': {
        "name": "طرح درس پیشرفته (FA)",
        "body": "شما یک مربی متخصص و طراح برنامه درسی تایید شده هستید. وظیفه شما تهیه یک طرح درس دقیق و منظم است.",
        "msg": "چارچوب کشور: {{ country_framework }}\nموضوع: {{ subject }}\nپایه: {{ grade }}\nعنوان درس: {{ title }}\nتوضیحات: {{ prompt_text }}\n\nمتن برنامه درسی:\n{{ curriculum_context }}\n\nقوانین موضوع: {{ topic_rules }}\nدستورالعمل‌های اضافی: {{ extra_instructions }}\n\nفقط JSON بازگردانید."
    }
}


class Command(BaseCommand):
    help = 'Seed hierarchical prompt rules across Country, Grade, Subject, and PromptTemplate layers across all 10 supported languages.'

    def handle(self, *args, **options):
        self.stdout.write("Seeding hierarchical AI prompt rules across all 10 supported languages...")

        # 1. Country Frameworks
        jordan_framework = "الالتزام التام بإطار وزارة التربية والتعليم في المملكة الأردنية الهاشمية، التركيز على نواتج التعلم، التفكير الناقد، وربط المفاهيم بالبيئة والحياة اليومية للطالب الأردني."
        saudi_framework = "الالتزام بإطار وزارة التعليم في المملكة العربية السعودية، معايير المناهج الوطنية، مهارات التفكير العليا، وربط التعلم برؤية 2030 وتطبيقات التقنية."

        CountryPromptProfile.objects.update_or_create(
            country="الأردن",
            defaults={"educational_framework": jordan_framework, "is_active": True}
        )
        CountryPromptProfile.objects.update_or_create(
            country="السعودية",
            defaults={"educational_framework": saudi_framework, "is_active": True}
        )
        self.stdout.write("  + Seeded CountryPromptProfiles (Jordan, Saudi Arabia)")

        # 2. Grade Prompt Profiles
        grades = Grade.objects.all()
        for g in grades:
            GradePromptProfile.objects.update_or_create(
                grade=g,
                defaults={
                    "learner_stage": "middle" if "متوسط" in str(g) or "سابع" in str(g) or "ثامن" in str(g) or "تاسع" in str(g) else "primary",
                    "language_guidance": "اللغة العربية/اللغة المستهدفة المبسطة، الواضحة، والخالية من التعقيد، مع استخدام المصطلحات العلمية والرياضية بدقة تامة.",
                    "content_depth_guidance": "عمق أكاديمي مناسب للمرحلة العمرية، يربط النظرية بالتطبيق العملي والأنشطة الصفية.",
                    "activity_guidance": "أنشطة تفاعلية ومجموعات عمل ثنائية وفردية تحفز الاستقصاء وحل المشكلات.",
                    "materials_guidance": "استخدام أدوات ميسرة ومتوافرة في البيئة المدرسية والمنزلية.",
                    "assessment_guidance": "تنويع أساليب التقييم (تشخيصي، تكويني، ختامي) مع أوراق عمل وتذكرة خروج.",
                    "forbidden_terms": ["زبائن", "عملاء", "مستخدمون تجاريون", "سلعة"],
                    "discouraged_patterns": ["الإجابات السطحية", "الحفظ الأصم دون فهم"],
                    "extra_instructions": [
                        "التزم حصرياً بنواتج التعلم الواردة في المنهاج الرسمي.",
                        "استخدم دائماً الدلالة المناسبة للإشارة إلى المتعلمين."
                    ],
                    "is_active": True
                }
            )
        self.stdout.write(f"  + Seeded GradePromptProfiles for {grades.count()} grades")

        # 3. Subject-Grade Prompt Profiles
        math_subject = Subject.objects.filter(translations__ar__name__icontains='رياضيات').first()
        if math_subject:
            for g_profile in GradePromptProfile.objects.all():
                SubjectPromptProfile.objects.update_or_create(
                    grade_profile=g_profile,
                    subject=math_subject,
                    defaults={
                        "language_guidance": "دقة مصطلحات الرياضيات (الكسور، التعابير الجبرية، المعادلات، المعاملات، الثوابت).",
                        "content_depth_guidance": "التسلسل المنطقي لخطوات الحل الرياضي، شرح الخوارزميات والخصائص الرياضية (مثل خاصية التوزيع والنظير الجمعي والضربي).",
                        "topic_rules": "في حل المعادلات الجبرية وتبسيط المقادير: اذكر الخطوة الرياضية صراحة (مثل: طرح 3 من الطرفين، قسمة الطرفين على 4). ممنوع القفز على النتائج.",
                        "extra_instructions": [
                            "التحقق من صحة الحل في نهاية كل مسألة رياضية.",
                            "توفير أمثلة متنوعة من حياة الطالب اليومية."
                        ],
                        "override_content_depth_guidance": True,
                        "is_active": True
                    }
                )
            self.stdout.write("  + Seeded SubjectPromptProfile for Mathematics")

        # 4. PromptTemplates across all 10 supported languages
        for lang, tdata in LOCALIZED_TEMPLATES.items():
            PromptTemplate.objects.update_or_create(
                feature_key='lesson_plan',
                language=lang,
                defaults={
                    "name": tdata["name"],
                    "template_body": tdata["body"],
                    "user_message_template": tdata["msg"],
                    "priority": 10,
                    "is_default": True,
                    "is_active": True
                }
            )
        self.stdout.write("  + Seeded multilingual PromptTemplates across all 10 supported languages (ar, en, fr, tr, ur, es, de, id, bn, fa)")
        self.stdout.write(self.style.SUCCESS("Successfully seeded hierarchical AI prompt rules across all layers and all 10 languages!"))

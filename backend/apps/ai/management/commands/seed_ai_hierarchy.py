from django.core.management.base import BaseCommand
from apps.ai.models import CountryPromptProfile, GradePromptProfile, SubjectPromptProfile, PromptTemplate
from apps.academics.models import Grade, Subject

class Command(BaseCommand):
    help = 'Seed hierarchical prompt rules across Country, Grade, Subject, and PromptTemplate layers (multilingual ar/en).'

    def handle(self, *args, **options):
        self.stdout.write("Seeding hierarchical AI prompt rules...")

        # 1. Country Frameworks
        jordan_framework = {
            'ar': "الالتزام التام بإطار وزارة التربية والتعليم في المملكة الأردنية الهاشمية، التركيز على نواتج التعلم، التفكير الناقد، وربط المفاهيم بالبيئة والحياة اليومية للطالب الأردني.",
            'en': "Strict adherence to the Hashemite Kingdom of Jordan Ministry of Education framework, focusing on learning outcomes, critical thinking, and real-world Jordanian contexts."
        }
        saudi_framework = {
            'ar': "الالتزام بإطار وزارة التعليم في المملكة العربية السعودية، معايير المناهج الوطنية، مهارات التفكير العليا، وربط التعلم برؤية 2030 وتطبيقات التقنية.",
            'en': "Adherence to Saudi Ministry of Education national curriculum standards, higher-order thinking skills, and Vision 2030."
        }

        CountryPromptProfile.objects.update_or_create(
            country="الأردن",
            defaults={"educational_framework": jordan_framework['ar'], "is_active": True}
        )
        CountryPromptProfile.objects.update_or_create(
            country="السعودية",
            defaults={"educational_framework": saudi_framework['ar'], "is_active": True}
        )
        self.stdout.write("  + Seeded CountryPromptProfiles (Jordan, Saudi Arabia)")

        # 2. Grade Prompt Profiles
        grades = Grade.objects.all()
        for g in grades:
            GradePromptProfile.objects.update_or_create(
                grade=g,
                defaults={
                    "learner_stage": "middle" if "متوسط" in str(g) or "سابع" in str(g) or "ثامن" in str(g) or "تاسع" in str(g) else "primary",
                    "language_guidance": "اللغة العربية الفصحى المبسطة، الواضحة، والخالية من التعقيد، مع استخدام المصطلحات العلمية والرياضية بدقة تامة.",
                    "content_depth_guidance": "عمق أكاديمي مناسب للمرحلة العمرية، يربط النظرية بالتطبيق العملي والأنشطة الصفية.",
                    "activity_guidance": "أنشطة تفاعلية ومجموعات عمل ثنائية وفردية تحفز الاستقصاء وحل المشكلات.",
                    "materials_guidance": "استخدام أدوات ميسرة ومتوافرة في البيئة المدرسية والمنزلية.",
                    "assessment_guidance": "تنويع أساليب التقييم (تشخيصي، تكويني، ختامي) مع أوراق عمل وتذكرة خروج.",
                    "forbidden_terms": ["زبائن", "عملاء", "مستخدمون تجاريون", "سلعة"],
                    "discouraged_patterns": ["الإجابات السطحية", "الحفظ الأصم دون فهم"],
                    "extra_instructions": [
                        "التزم حصرياً بنواتج التعلم الواردة في المنهاج الرسمي.",
                        "استخدم دائماً كلمة «الطلاب» للإشارة إلى المتعلمين."
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

        # 4. PromptTemplates (Multilingual ar / en)
        for lang in ['ar', 'en']:
            is_ar = lang == 'ar'
            PromptTemplate.objects.update_or_create(
                feature_key='lesson_plan',
                language=lang,
                defaults={
                    "name": f"خطة الدرس المتقدمة ({lang.upper()})",
                    "template_body": (
                        "أنت معلم خبير ومصمم مناهج تعليمية معتمد. مهمتك إعداد خطة درس تفصيلية، دقيقة، ومنظمة." if is_ar else
                        "You are an expert educator and certified curriculum designer. Your task is to prepare a detailed, precise lesson plan."
                    ),
                    "user_message_template": (
                        "إطار الدولة: {{ country_framework }}\nالمادة: {{ subject }}\nالمرحلة: {{ grade }}\nعنوان الدرس: {{ title }}\nوصف الدرس: {{ prompt_text }}\n\nسياق المنهاج الرسمي:\n{{ curriculum_context }}\n\nقواعد المادة والعمق: {{ topic_rules }}\nتعليمات إضافية: {{ extra_instructions }}\n\nأجب بصيغة JSON فقط." if is_ar else
                        "Country Framework: {{ country_framework }}\nSubject: {{ subject }}\nGrade: {{ grade }}\nLesson Title: {{ title }}\nDescription: {{ prompt_text }}\n\nCurriculum Context:\n{{ curriculum_context }}\n\nTopic Rules: {{ topic_rules }}\nExtra Instructions: {{ extra_instructions }}\n\nReturn JSON only."
                    ),
                    "priority": 10,
                    "is_default": True,
                    "is_active": True
                }
            )
        self.stdout.write("  + Seeded multilingual PromptTemplates (ar, en)")
        self.stdout.write(self.style.SUCCESS("Successfully seeded hierarchical AI prompt rules across all layers!"))

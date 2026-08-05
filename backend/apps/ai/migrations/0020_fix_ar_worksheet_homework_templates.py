from django.db import migrations


WORKSHEET_AR = (
    "أنت مصمم أوراق عمل تعليمية محترف. بناءً على خطة الدرس التالية:\n{{ plan_data }}\n\n"
    "قم بإنشاء ورقة عمل تعليمية شاملة ومناسبة للطلاب بصيغة JSON فقط (بدون markdown):\n\n"
    "JSON format المطلوب:\n"
    "{\n"
    '  "title": "عنوان ورقة العمل",\n'
    '  "subject": "المادة",\n'
    '  "grade": "الصف",\n'
    '  "instructions": "تعليمات عامة للطلاب مع شرح كيفية حل ورقة العمل",\n'
    '  "sections": [\n'
    '    {\n'
    '      "section_title": "عنوان القسم",\n'
    '      "section_instructions": "تعليمات القسم",\n'
    '      "questions": [\n'
    '        {\n'
    '          "question_number": 1,\n'
    '          "type": "اختيار من متعدد | صح أو خطأ | أكمل الفراغ | إجابة قصيرة | إجابة مطولة | توصيل | ترتيب",\n'
    '          "question_text": "نص السؤال",\n'
    '          "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],\n'
    '          "answer": "الإجابة الصحيحة",\n'
    '          "points": 1,\n'
    '          "bloom_level": "تذكر | فهم | تطبيق | تحليل | تركيب | تقييم"\n'
    "        }\n"
    "      ]\n"
    "    }\n"
    "  ],\n"
    '  "total_points": 20,\n'
    '  "time_minutes": 30\n'
    "}\n\n"
    "متطلبات الجودة:\n"
    "- تنوع الأسئلة بين مستويات بلوم المعرفية المختلفة.\n"
    "- وضوح الصياغة وخلوها من الغموض.\n"
    "- مناسبة لمستوى الطلاب العمري والمعرفي.\n"
    "- مراعاة الفروق الفردية بتنوع مستويات الصعوبة.\n"
    "- وجود تعليمات واضحة قبل كل قسم."
)

HOMEWORK_AR = (
    "أنت مصمم واجبات منزلية تعليمية محترف. بناءً على خطة الدرس التالية:\n{{ plan_data }}\n\n"
    "قم بإنشاء واجب منزلي تفصيلي ومناسب للطلاب بصيغة JSON فقط (بدون markdown):\n\n"
    "JSON format المطلوب:\n"
    "{\n"
    '  "subject": "المادة",\n'
    '  "title": "عنوان الواجب المنزلي",\n'
    '  "grade": "الصف",\n'
    '  "instructions": "تعليمات عامة للطالب",\n'
    '  "due_date": "موعد التسليم (عدد أيام من اليوم)",\n'
    '  "tasks": [\n'
    '    {\n'
    '      "task_number": 1,\n'
    '      "task_type": "كتابة | قراءة | بحث | حل مسائل | مشروع | حفظ | مراجعة",\n'
    '      "description": "وصف المهمة بالتفصيل",\n'
    '      "estimated_time_minutes": 15,\n'
    '      "resources_needed": ["مورد 1", "مورد 2"],\n'
    '      "success_criteria": ["معيار النجاح 1", "معيار النجاح 2"]\n'
    "    }\n"
    "  ],\n"
    '  "parent_involvement": "كيف يمكن لولي الأمر المساعدة",\n'
    '  "total_estimated_time_minutes": 45,\n'
    '  "notes": "ملاحظات إضافية للمعلم"\n'
    "}\n\n"
    "متطلبات الجودة:\n"
    "- أن يكون الواجب هادفاً ومعززاً لأهداف الدرس.\n"
    "- تنوع المهام بين مهارات التفكير المختلفة.\n"
    "- تحديد معايير النجاح لكل مهمة لمساعدة الطالب على التقويم الذاتي.\n"
    "- مراعاة ألا يكون الواجب مرهقاً أو طويلاً بشكل غير معقول.\n"
    "- إشراك ولي الأمر عند الحاجة بطريقة إيجابية."
)


def fix_templates(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    fixes = [
        ('worksheet', WORKSHEET_AR, 'أنشئ ورقة عمل بناءً على خطة الدرس.'),
        ('homework', HOMEWORK_AR, 'أنشئ واجباً منزلياً بناءً على خطة الدرس.'),
    ]
    for feature_key, body, user_msg in fixes:
        PromptTemplate.objects.filter(
            feature_key=feature_key,
            language='ar',
            is_default=True,
        ).update(
            template_body=body,
            user_message_template=user_msg,
            is_active=True,
        )


def reverse_fix(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0019_update_openai_compatible_needs_api_key'),
    ]

    operations = [
        migrations.RunPython(fix_templates, reverse_fix),
    ]

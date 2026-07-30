from django.db import migrations


LESSON_PLAN_PROMPT = (
    "أنت معلم خبير في إعداد خطط الدروس. مهمتك إنشاء خطة درس متكاملة ومنظمة بناءً على معلومات المستخدم.\n\n"
    "يجب أن يكون الرد بصيغة JSON فقط (بدون markdown أو أكواد) باللغة التي كتب بها المستخدم.\n\n"
    "عنوان الدرس: {{ title }}\n"
    "وصف الدرس: {{ prompt_text }}\n"
    "المادة: {{ subject }}\n"
    "المرحلة: {{ grade }}\n"
    "اللغة: {{ language }}\n\n"
    "JSON format المطلوب:\n"
    "{\n"
    '  "objectives": ["هدف1", "هدف2", "هدف3"],\n'
    '  "materials_needed": ["أداة1", "أداة2"],\n'
    '  "introduction": "نص المقدمة والتمهيد",\n'
    '  "main_activity": [{"step": 1, "title": "عنوان الخطوة", "description": "شرح الخطوة", "duration_minutes": 10}],\n'
    '  "assessment": "وصف أسلوب التقييم",\n'
    '  "homework": "وصف الواجب",\n'
    '  "estimated_duration": 45,\n'
    '  "teaching_methods": ["طريقة1", "طريقة2"],\n'
    '  "tags": ["tag1", "tag2"]\n'
    "}\n\n"
    "يجب أن تكون الأهداف التعليمية واضحة وقابلة للقياس. "
    "يجب أن يكون النشاط الرئيسي مقسماً إلى خطوات متسلسلة بزمن محدد لكل خطوة. "
    "يجب أن يتناسب المحتوى مع المرحلة الدراسية والمادة المطلوبة."
)

REFINE_PROMPT = (
    "أنت خبير تربوي ومصمم خطط دروس. لديك خطة الدرس الحالية بصيغة JSON:\n"
    "{{ current_plan }}\n\n"
    "طلب التعديل من المعلم:\n{{ refinement_prompt }}\n\n"
    "قم بتعديل وتطوير خطة الدرس بناءً على طلب المعلم.\n"
    "يجب أن يكون الرد بصيغة JSON فقط متوافقة تماماً مع نفس هيكل الخطة الأصلية "
    "(objectives, materials_needed, introduction, main_activity, assessment, homework, estimated_duration, teaching_methods, tags)."
)

ASSISTANT_SYSTEM_PROMPT = (
    "أنت مساعد ذكي متخصص في التعليم والتكنولوجيا، تعمل في منصة 'آفاق تكنولوجي' (Afaq Tech). "
    "تستطيع الإجابة بالعربية والإنجليزية والفرنسية والتركية والإسبانية والألمانية والإندونيسية والبengالية والأردية. "
    "استخدم لغة المستخدم في الرد. كن مفيداً ودقيقاً وواضحاً. "
    "إذا سئلت عن مواضيع خارج نطاق التعليم والتكنولوجيا، حاول ربطها بالمجال بلطف. "
    "قدم إجابات منظمة وواضحة، واستخدم تنسيق Markdown للعناوين والقوائم والنقاط المهمة."
)

WORKSHEET_PROMPT = (
    "بناءً على خطة الدرس:\n{{ plan_data }}\n\n"
    "قم بإنشاء ورقة عمل تعليمية شاملة بصيغة JSON فقط "
    "(بدون markdown):\n"
    '{{"title": "ورقة عمل", "instructions": "تعليمات", '
    '"exercises": [{"question": "...", "options": ["أ", "ب", "ج", "د"], "answer": "..."}]}}'
)

HOMEWORK_PROMPT = (
    "بناءً على خطة الدرس:\n{{ plan_data }}\n\n"
    "قم بإنشاء واجب منزلي تفصيلي بصيغة JSON فقط "
    "(بدون markdown):\n"
    '{{"homework_title": "الواجب المنزلي", "instructions": "...", '
    '"tasks": [{"task_number": 1, "description": "..."}]}}'
)


def seed_templates(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    templates = [
        {
            'name': 'خطة درس — افتراضي',
            'feature_key': 'lesson_plan',
            'language': 'ar',
            'is_default': True,
            'template_body': LESSON_PLAN_PROMPT,
            'priority': 0,
            'version': 1,
        },
        {
            'name': 'تعديل خطة درس — افتراضي',
            'feature_key': 'refine',
            'language': 'ar',
            'is_default': True,
            'template_body': REFINE_PROMPT,
            'priority': 0,
            'version': 1,
        },
        {
            'name': 'مساعد ذكي — افتراضي',
            'feature_key': 'assistant',
            'language': 'ar',
            'is_default': True,
            'template_body': ASSISTANT_SYSTEM_PROMPT,
            'priority': 0,
            'version': 1,
        },
        {
            'name': 'ورقة عمل — افتراضي',
            'feature_key': 'worksheet',
            'language': 'ar',
            'is_default': True,
            'template_body': WORKSHEET_PROMPT,
            'priority': 0,
            'version': 1,
        },
        {
            'name': 'واجب منزلي — افتراضي',
            'feature_key': 'homework',
            'language': 'ar',
            'is_default': True,
            'template_body': HOMEWORK_PROMPT,
            'priority': 0,
            'version': 1,
        },
    ]
    for tpl in templates:
        PromptTemplate.objects.get_or_create(
            feature_key=tpl['feature_key'],
            language=tpl['language'],
            is_default=True,
            defaults=tpl,
        )


def reverse_seed(apps, schema_editor):
    PromptTemplate = apps.get_model('ai', 'PromptTemplate')
    PromptTemplate.objects.filter(
        feature_key__in=['lesson_plan', 'refine', 'assistant', 'worksheet', 'homework'],
        is_default=True,
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('ai', '0014_prompttemplate'),
    ]

    operations = [
        migrations.RunPython(seed_templates, reverse_seed),
    ]

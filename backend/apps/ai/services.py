import json
import time
import hashlib
import google.generativeai as genai
from openai import OpenAI
from django.conf import settings
from django.core.cache import cache
from django.db.models import Case, IntegerField, Q, Value, When
from django.template import Context, Template
from .models import AIModel, AIProvider, PromptTemplate
from apps.academics.models import CurriculumDocument

genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "أنت مساعد ذكي متخصص في التعليم والتكنولوجيا، تعمل في منصة 'آفاق تكنولوجي' (Afaq Tech). "
    "تستطيع الإجابة بالعربية والإنجليزية والفرنسية والتركية والإسبانية والألمانية والإندونيسية والبengالية والأردية. "
    "استخدم لغة المستخدم في الرد. كن مفيداً ودقيقاً وواضحاً. "
    "إذا سئلت عن مواضيع خارج نطاق التعليم والتكنولوجيا، حاول ربطها بالمجال بلطف. "
    "قدم إجابات منظمة وواضحة، واستخدم تنسيق Markdown للعناوين والقوائم والنقاط المهمة."
)

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

DEFAULT_MODEL = "gemini-3.6-flash"


class PromptBuilderService:
    @classmethod
    def select_template(cls, feature_key='lesson_plan', language='ar', learner_stage=None, subject=None, curriculum=None):
        qs = PromptTemplate.objects.filter(
            feature_key=feature_key,
            language=language,
            is_active=True,
        ).select_related("subject", "curriculum")

        qs = qs.annotate(
            specificity=Case(
                When(
                    Q(curriculum=curriculum) & Q(subject=subject) & Q(learner_stage=learner_stage),
                    then=Value(4),
                ),
                When(
                    Q(subject=subject) & Q(learner_stage=learner_stage),
                    then=Value(3),
                ),
                When(
                    Q(learner_stage=learner_stage),
                    then=Value(2),
                ),
                When(
                    Q(is_default=True),
                    then=Value(1),
                ),
                default=Value(0),
                output_field=IntegerField(),
            )
        ).filter(specificity__gt=0)

        template = qs.order_by(
            "-specificity",
            "-is_default",
            "-priority",
            "-updated_at",
            "-id",
        ).first()

        if template:
            return template

        fallback = PromptTemplate.objects.filter(feature_key=feature_key, is_default=True, is_active=True).first()
        if fallback:
            return fallback

        return None

    @classmethod
    def build_prompt(cls, feature_key='lesson_plan', language='ar', variables=None, learner_stage=None, subject=None, curriculum=None):
        variables = variables or {}
        template_obj = cls.select_template(
            feature_key=feature_key,
            language=language,
            learner_stage=learner_stage,
            subject=subject,
            curriculum=curriculum,
        )

        if template_obj:
            body = template_obj.template_body
        else:
            body = LESSON_PLAN_PROMPT

        rendered = Template(body).render(Context(variables))
        return rendered


def _resolve_model_and_client(requested_model_id=None):
    model_obj = None
    if requested_model_id:
        model_obj = AIModel.objects.filter(model_id=requested_model_id, is_active=True).first()
    if not model_obj:
        model_obj = AIModel.objects.filter(is_default=True, is_active=True).first()
    if not model_obj:
        model_obj = AIModel.objects.filter(is_active=True).first()
    
    if not model_obj:
        return 'google', DEFAULT_MODEL, settings.GEMINI_API_KEY, ''

    provider_code = model_obj.provider
    model_id = model_obj.model_id

    provider_inst = AIProvider.objects.filter(provider_type__code=provider_code, is_active=True).first()
    api_key = ""
    base_url = ""
    if provider_inst:
        api_key = provider_inst.get_api_key()
        base_url = provider_inst.base_url

    if not api_key:
        if provider_code == 'google':
            api_key = getattr(settings, 'GEMINI_API_KEY', '')
        elif provider_code == 'openai':
            api_key = getattr(settings, 'OPENAI_API_KEY', '')

    return provider_code, model_id, api_key, base_url


def _build_history(messages_qs):
    history = []
    for msg in messages_qs:
        role = "model" if msg.role == "assistant" else "user"
        history.append({"role": role, "parts": [msg.content]})
    return history


def chat_stream(messages, new_message, model_id=None):
    provider_code, model_name, api_key, base_url = _resolve_model_and_client(model_id)

    total_tokens = 0
    full_text = ""
    start_time = time.time()

    if provider_code == 'google':
        if api_key:
            genai.configure(api_key=api_key)
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)

        conversation_history = _build_history(messages)
        model = genai.GenerativeModel(
            model_name,
            system_instruction=SYSTEM_PROMPT,
        )
        chat = model.start_chat(history=conversation_history)
        response = chat.send_message(new_message, stream=True)

        for chunk in response:
            if chunk.text:
                full_text += chunk.text
                if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                    total_tokens = chunk.usage_metadata.total_token_count
                yield chunk.text, None, None, None, model_name

        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            total_tokens = response.usage_metadata.total_token_count

    else:
        # OpenAI, Ollama, OpenAI Compatible
        if provider_code == 'ollama':
            client_base_url = (base_url or 'http://localhost:11434').rstrip('/') + '/v1'
            client_api_key = api_key or 'ollama'
        elif provider_code == 'openai_compatible':
            client_base_url = (base_url or '').rstrip('/') + '/v1'
            client_api_key = api_key or 'sk-placeholder'
        else:
            client_base_url = None
            client_api_key = api_key or 'sk-placeholder'

        client = OpenAI(api_key=client_api_key, base_url=client_base_url)
        
        openai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in messages:
            openai_messages.append({"role": msg.role, "content": msg.content})
        openai_messages.append({"role": "user", "content": new_message})

        response = client.chat.completions.create(
            model=model_name,
            messages=openai_messages,
            stream=True,
        )

        for chunk in response:
            delta = chunk.choices[0].delta.content if chunk.choices and chunk.choices[0].delta else None
            if delta:
                full_text += delta
                yield delta, None, None, None, model_name

    elapsed = int((time.time() - start_time) * 1000)
    yield None, full_text, total_tokens, elapsed, model_name


def generate_lesson_plan(title, prompt_text, subject="", grade="", language="ar", model_id=None, subject_obj=None, grade_obj=None, learner_stage=""):
    # Semantic Caching check
    cache_key_data = f"{title}-{prompt_text}-{subject}-{grade}-{language}-{model_id}"
    cache_hash = hashlib.sha256(cache_key_data.encode('utf-8')).hexdigest()
    cached_result = cache.get(f"ai_lesson_plan:{cache_hash}")
    if cached_result:
        return cached_result, (model_id or DEFAULT_MODEL), 0, 0

    provider_code, model_name, api_key, base_url = _resolve_model_and_client(model_id)

    # Curriculum document context injection
    curriculum_text = ""
    if subject_obj:
        docs = CurriculumDocument.objects.filter(subject=subject_obj)[:3]
        for d in docs:
            if d.extracted_text:
                curriculum_text += f"\n[مرجع المنهاج: {d.title}]\n{d.extracted_text[:3000]}\n"

    variables = {
        "title": title,
        "prompt_text": prompt_text,
        "subject": subject,
        "grade": grade,
        "language": language,
        "curriculum_context": curriculum_text,
    }

    lesson_prompt = PromptBuilderService.build_prompt(
        feature_key='lesson_plan',
        language=language,
        variables=variables,
        learner_stage=learner_stage,
        subject=subject_obj,
    )

    start_time = time.time()
    tokens = 0
    raw = ""

    if provider_code == 'google':
        if api_key:
            genai.configure(api_key=api_key)
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)

        model = genai.GenerativeModel(
            model_name,
            system_instruction=lesson_prompt,
        )
        response = model.generate_content("قم بإنشاء خطة الدرس المطلوبة.")
        raw = response.text.strip()
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            tokens = response.usage_metadata.total_token_count
    else:
        if provider_code == 'ollama':
            client_base_url = (base_url or 'http://localhost:11434').rstrip('/') + '/v1'
            client_api_key = api_key or 'ollama'
        elif provider_code == 'openai_compatible':
            client_base_url = (base_url or '').rstrip('/') + '/v1'
            client_api_key = api_key or 'sk-placeholder'
        else:
            client_base_url = None
            client_api_key = api_key or 'sk-placeholder'

        client = OpenAI(api_key=client_api_key, base_url=client_base_url)
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": lesson_prompt},
                {"role": "user", "content": "قم بإنشاء خطة الدرس المطلوبة."}
            ],
        )
        raw = response.choices[0].message.content.strip()
        if hasattr(response, 'usage') and response.usage:
            tokens = response.usage.total_tokens

    elapsed = int((time.time() - start_time) * 1000)

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    try:
        plan_data = json.loads(raw)
    except json.JSONDecodeError:
        plan_data = {"raw_response": raw, "error": "failed to parse structured JSON"}

    # Cache successful plan for 24 hours
    if "error" not in plan_data:
        cache.set(f"ai_lesson_plan:{cache_hash}", plan_data, 86400)

    return plan_data, model_name, tokens, elapsed


def refine_lesson_plan(current_plan_data, refinement_prompt, language="ar", model_id=None):
    provider_code, model_name, api_key, base_url = _resolve_model_and_client(model_id)

    refine_system_prompt = (
        f"أنت خبير تربوي ومصمم خطط دروس. لديك خطة الدرس الحالية بصيغة JSON:\n{json.dumps(current_plan_data, ensure_ascii=False)}\n\n"
        f"طلب التعديل من المعلم:\n{refinement_prompt}\n\n"
        "قم بتعديل وتطوير خطة الدرس بناءً على طلب المعلم.\n"
        "يجب أن يكون الرد بصيغة JSON فقط متوافقة تماماً مع نفس هيكل الخطة الأصلية (objectives, materials_needed, introduction, main_activity, assessment, homework, estimated_duration, teaching_methods, tags)."
    )

    start_time = time.time()
    tokens = 0
    raw = ""

    if provider_code == 'google':
        if api_key:
            genai.configure(api_key=api_key)
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)

        model = genai.GenerativeModel(model_name, system_instruction=refine_system_prompt)
        response = model.generate_content("قم بتعديل خطة الدرس المطلوبة.")
        raw = response.text.strip()
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            tokens = response.usage_metadata.total_token_count
    else:
        client = OpenAI(api_key=api_key or 'sk-placeholder', base_url=(base_url or '').rstrip('/') + '/v1' if base_url else None)
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": refine_system_prompt},
                {"role": "user", "content": "قم بتعديل خطة الدرس المطلوبة."}
            ]
        )
        raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    try:
        plan_data = json.loads(raw)
    except json.JSONDecodeError:
        plan_data = {"raw_response": raw, "error": "failed to parse structured JSON"}

    return plan_data, model_name, tokens


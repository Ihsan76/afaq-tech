import hashlib
import json
import time

from django.conf import settings
from django.core.cache import cache
from django.db.models import Case, IntegerField, Q, Value, When
from django.template import Context, Template
from google import genai
from openai import OpenAI

from apps.academics.models import CurriculumDocument

from .models import AIModel, AIProvider, PromptTemplate
from .router import ProviderRouter
from .utils import extract_json

router = ProviderRouter()

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
    def build_prompt_constraints(cls, grade, subject=None):
        from .models import GradePromptProfile, SubjectPromptProfile

        try:
            base = grade.prompt_profile
        except GradePromptProfile.DoesNotExist:
            return {}

        if not base.is_active:
            return {}

        subj_profile = None
        if subject:
            subj_profile = SubjectPromptProfile.objects.filter(
                grade_profile=base, subject=subject, is_active=True
            ).first()

        def pick(field, override_flag):
            if subj_profile and getattr(subj_profile, override_flag, False):
                return getattr(subj_profile, field, '')
            return getattr(base, field, '')

        def merge_list(base_list, subj_list, merge_flag):
            if not subj_profile:
                return base_list
            if getattr(subj_profile, merge_flag, True):
                return base_list + [x for x in subj_list if x not in base_list]
            return subj_list

        return {
            'learner_stage': pick('learner_stage', 'override_learner_stage') or '',
            'language_guidance': pick('language_guidance', 'override_language_guidance'),
            'content_depth_guidance': pick('content_depth_guidance', 'override_content_depth_guidance'),
            'activity_guidance': pick('activity_guidance', 'override_activity_guidance'),
            'materials_guidance': pick('materials_guidance', 'override_materials_guidance'),
            'assessment_guidance': pick('assessment_guidance', 'override_assessment_guidance'),
            'forbidden_terms': ', '.join(merge_list(base.forbidden_terms, subj_profile.forbidden_terms if subj_profile else [], 'merge_forbidden_terms')),
            'discouraged_patterns': ', '.join(merge_list(base.discouraged_patterns, subj_profile.discouraged_patterns if subj_profile else [], 'merge_discouraged_patterns')),
            'extra_instructions': '\n'.join(merge_list(base.extra_instructions, subj_profile.extra_instructions if subj_profile else [], 'merge_extra_instructions')),
            'topic_rules': subj_profile.topic_rules if subj_profile else '',
        }

    @classmethod
    def build_prompt(cls, feature_key='lesson_plan', language='ar', variables=None, learner_stage=None, subject=None, curriculum=None, grade=None):
        variables = variables or {}

        if grade is not None:
            constraints = cls.build_prompt_constraints(grade, subject=subject)
            variables.update(constraints)
            if not learner_stage:
                learner_stage = constraints.get('learner_stage') or learner_stage

        template_obj = cls.select_template(
            feature_key=feature_key,
            language=language,
            learner_stage=learner_stage,
            subject=subject,
            curriculum=curriculum,
        )

        if not template_obj:
            return "", ""

        system = Template(template_obj.template_body).render(Context(variables))
        user_msg = ""
        if template_obj.user_message_template:
            user_msg = Template(template_obj.user_message_template).render(Context(variables))
        return system, user_msg

    @classmethod
    def build_system_prompt(cls, feature_key='lesson_plan', language='ar', variables=None, learner_stage=None, subject=None, curriculum=None, grade=None):
        return cls.build_prompt(feature_key, language, variables, learner_stage, subject, curriculum, grade)[0]


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
        history.append({"role": role, "parts": [{"text": msg.content}]})
    return history


def _get_system_prompt(language='ar'):
    return PromptBuilderService.build_system_prompt(
        feature_key='assistant',
        language=language,
    )


def chat_stream(messages, new_message, model_id=None):
    provider_code, model_name, api_key, base_url = _resolve_model_and_client(model_id)

    total_tokens = 0
    full_text = ""
    start_time = time.time()

    system_prompt = _get_system_prompt()

    if provider_code == 'google':
        k = api_key if api_key else settings.GEMINI_API_KEY
        client = genai.Client(api_key=k)

        conversation_history = _build_history(messages)
        config = genai.types.GenerateContentConfig(system_instruction=system_prompt)
        chat = client.chats.create(
            model=model_name,
            history=conversation_history,
            config=config,
        )
        response = chat.send_message_stream(new_message)

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
            b_url = (base_url or '').rstrip('/')
            if b_url and not b_url.endswith('/v1'):
                b_url += '/v1'
            client_base_url = b_url
            client_api_key = api_key or 'sk-placeholder'
        else:
            client_base_url = None
            client_api_key = api_key or 'sk-placeholder'

        client = OpenAI(api_key=client_api_key, base_url=client_base_url)

        openai_messages = [{"role": "system", "content": system_prompt}]
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


def generate_lesson_plan(title, prompt_text, subject="", grade="", language="ar", model_id=None, subject_obj=None, grade_obj=None, learner_stage="", curriculum_context=""):
    cache_key_data = f"{title}-{prompt_text}-{subject}-{grade}-{language}-{model_id}-{curriculum_context}"
    cache_hash = hashlib.sha256(cache_key_data.encode('utf-8')).hexdigest()
    cached_result = cache.get(f"ai_lesson_plan:{cache_hash}")
    if cached_result:
        return cached_result, (model_id or DEFAULT_MODEL), 0, 0

    # Official curriculum context takes precedence; fall back to uploaded docs.
    if not curriculum_context and subject_obj:
        docs = CurriculumDocument.objects.filter(subject=subject_obj)[:3]
        curriculum_text = ""
        for d in docs:
            if d.extracted_text:
                curriculum_text += f"\n[مرجع المنهاج: {d.title}]\n{d.extracted_text[:3000]}\n"
    else:
        curriculum_text = curriculum_context

    variables = {
        "title": title,
        "prompt_text": prompt_text,
        "subject": subject,
        "grade": grade,
        "language": language,
        "curriculum_context": curriculum_text,
    }

    lesson_prompt, user_msg = PromptBuilderService.build_prompt(
        feature_key='lesson_plan',
        language=language,
        variables=variables,
        learner_stage=learner_stage,
        subject=subject_obj,
        grade=grade_obj,
    )

    ai_resp = router.generate(
        prompt=user_msg or "قم بإنشاء خطة الدرس المطلوبة.",
        feature="lesson_plan",
        system_instruction=lesson_prompt,
        model_id=model_id,
    )

    raw = ai_resp.content
    model_name = ai_resp.model
    tokens = ai_resp.total_tokens
    elapsed = ai_resp.latency_ms

    if not ai_resp.success:
        err_msg = ai_resp.error or ""
        if "429" in err_msg or "quota" in err_msg.lower() or "too many requests" in err_msg.lower():
            return {"raw_response": raw, "error": "AI quota exceeded (429 Too Many Requests). Please switch to another AI model."}, model_name, tokens, elapsed
        return {"raw_response": raw, "error": f"AI generation failed: {ai_resp.error}"}, model_name, tokens, elapsed

    try:
        plan_data = extract_json(raw)
        if isinstance(plan_data, dict):
            if 'lesson_plan' in plan_data and isinstance(plan_data['lesson_plan'], dict):
                plan_data = plan_data['lesson_plan']
            elif 'plan' in plan_data and isinstance(plan_data['plan'], dict):
                plan_data = plan_data['plan']
    except ValueError:
        plan_data = {"raw_response": raw, "error": "failed to parse structured JSON"}

    if "error" not in plan_data:
        cache.set(f"ai_lesson_plan:{cache_hash}", plan_data, 86400)

    return plan_data, model_name, tokens, elapsed


def refine_lesson_plan(current_plan_data, refinement_prompt, language="ar", model_id=None):
    variables = {
        "current_plan": json.dumps(current_plan_data, ensure_ascii=False),
        "refinement_prompt": refinement_prompt,
    }
    refine_prompt_body, user_msg = PromptBuilderService.build_prompt(
        feature_key='refine',
        language=language,
        variables=variables,
    )

    ai_resp = router.generate(
        prompt=user_msg or "قم بتعديل خطة الدرس المطلوبة.",
        feature="refine",
        system_instruction=refine_prompt_body,
        model_id=model_id,
    )

    raw = ai_resp.content
    model_name = ai_resp.model
    tokens = ai_resp.total_tokens

    if not ai_resp.success:
        return {"raw_response": raw, "error": f"Refinement failed: {ai_resp.error}"}, model_name, tokens

    try:
        plan_data = extract_json(raw)
    except ValueError:
        plan_data = {"raw_response": raw, "error": "failed to parse structured JSON"}

    return plan_data, model_name, tokens


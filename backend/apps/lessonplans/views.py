import contextlib
import json

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.academics.models import Curriculum, CurriculumDocument, Grade, Subject, Unit
from apps.ai.models import AIRun
from apps.ai.services import PromptBuilderService
from apps.ai.services import generate_lesson_plan as ai_generate
from apps.ai.services import refine_lesson_plan as ai_refine
from apps.subscriptions.services import record_usage, usage_allowed

from .models import LessonPlan, LessonPlanRefinement
from .serializers import LessonPlanDetailSerializer, LessonPlanSerializer

FONT_DIR = settings.BASE_DIR / 'apps' / 'lessonplans' / 'fonts'


def _get_plan_or_403(pk, request):
    """Return plan if user is owner or admin, else 403."""
    plan = get_object_or_404(LessonPlan, pk=pk)
    if plan.user != request.user and not request.user.is_staff:
        return None
    return plan


def build_curriculum_context(grade_obj, subject_obj, unit_obj=None, language='ar'):
    """Resolve the official curriculum matching grade + subject and build an injection context.

    Returns (context_text, label). When no curriculum matches, returns ('', '').
    """
    if not grade_obj or not subject_obj:
        return '', ''

    if unit_obj is not None:
        curriculum = unit_obj.curriculum
    else:
        curriculum = Curriculum.objects.filter(grade=grade_obj).order_by('-year', '-id').first()
    if curriculum is None:
        return '', ''

    label = curriculum.translations.get(language, {}).get('name') or curriculum.translations.get('ar', {}).get('name', '')
    country = curriculum.country
    year = curriculum.year

    if unit_obj and unit_obj.curriculum_id == curriculum.id and unit_obj.subject_id == subject_obj.id:
        units = [unit_obj]
    else:
        units = list(Unit.objects.filter(curriculum=curriculum, subject=subject_obj).order_by('order'))

    if not units:
        return '', label

    def loc_name(translations):
        return translations.get(language, {}).get('name') or translations.get('ar', {}).get('name', '')

    parts = [f"[المنهاج الرسمي: {label} — {country} ({year})]"]
    for u in units:
        parts.append(f"- الوحدة: {loc_name(u.translations)}")
        for o in (u.outcomes or []):
            parts.append(f"    ناتج تعلم: {o}")
    return '\n'.join(parts), label

class LessonPlanListView(generics.ListAPIView):
    serializer_class = LessonPlanSerializer

    def get_queryset(self):
        return LessonPlan.objects.filter(user=self.request.user)

class LessonPlanDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonPlanDetailSerializer

    def get_queryset(self):
        return LessonPlan.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_lesson_plan(request):
    title = request.data.get('title', '').strip()
    prompt_text = request.data.get('prompt', '').strip()
    subject_id = request.data.get('subject')
    grade_id = request.data.get('grade')
    unit_id = request.data.get('unit')
    language = request.data.get('language', 'ar')
    model_id = request.data.get('model_id')

    if not title:
        return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not prompt_text:
        return Response({'error': 'Lesson description is required'}, status=status.HTTP_400_BAD_REQUEST)

    allowed, used, limit = usage_allowed(request.user, 'ai_lesson_plans')
    if not allowed:
        return Response(
            {'error': 'usage_limit_reached', 'used': used, 'limit': limit},
            status=status.HTTP_402_PAYMENT_REQUIRED,
        )

    subject_obj = None
    grade_obj = None
    unit_obj = None
    subject_name = ''
    grade_name = ''
    if subject_id:
        subject_obj = Subject.objects.filter(pk=subject_id).first()
        if subject_obj:
            subject_name = subject_obj.translations.get(language, {}).get('name') or subject_obj.translations.get('ar', {}).get('name', '')
    if grade_id:
        grade_obj = Grade.objects.filter(pk=grade_id).first()
        if grade_obj:
            grade_name = grade_obj.translations.get(language, {}).get('name') or grade_obj.translations.get('ar', {}).get('name', '')
    if unit_id:
        unit_obj = Unit.objects.filter(pk=unit_id).first()

    curriculum_context, curriculum_label = build_curriculum_context(
        grade_obj=grade_obj, subject_obj=subject_obj, unit_obj=unit_obj, language=language,
    )

    curriculum_file = request.FILES.get('curriculum_file')
    if curriculum_file:
        try:
            file_content = curriculum_file.read().decode('utf-8', errors='ignore')
            CurriculumDocument.objects.create(
                curriculum_id=None,
                subject=subject_obj,
                title=curriculum_file.name,
                file=curriculum_file,
                extracted_text=file_content[:10000]
            )
        except Exception:
            pass

    try:
        plan_data, model_used, tokens, duration = ai_generate(
            title=title,
            prompt_text=prompt_text,
            subject=subject_name,
            grade=grade_name,
            language=language,
            model_id=model_id,
            subject_obj=subject_obj,
            grade_obj=grade_obj,
            curriculum_context=curriculum_context,
        )
    except Exception as e:
        return Response({'error': f'Failed to generate plan: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

    if 'error' in plan_data:
        err_str = plan_data.get('error', '')
        if '429' in err_str or 'quota' in err_str.lower() or 'too many requests' in err_str.lower():
            msg = (
                'لقد تم استنفاد الحصة المجانية لمزود الذكاء الاصطناعي (خطأ 429). يرجى التبديل إلى نموذج ذكاء اصطناعي آخر.'
                if language == 'ar'
                else 'AI quota exceeded (429 Too Many Requests). Please switch to another AI model.'
            )
            return Response({
                'error': 'ai_quota_exceeded',
                'message': msg,
                'details': err_str
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        return Response({
            'error': 'Failed to parse AI response in structured format',
            'raw_response': plan_data.get('raw_response', ''),
            'details': err_str,
        }, status=status.HTTP_502_BAD_GATEWAY)

    lesson_plan = LessonPlan.objects.create(
        user=request.user,
        title=title,
        subject_id=subject_id or None,
        grade_id=grade_id or None,
        plan_data=plan_data,
        generated_by='ai',
        ai_model_used=model_used,
        status='draft',
    )

    with contextlib.suppress(Exception):
        record_usage(request.user, 'ai_lesson_plans')

    AIRun.objects.create(
        user=request.user,
        feature=AIRun.Feature.LESSON_PLAN,
        prompt=f"{title}\n{prompt_text}",
        response=str(plan_data)[:5000],
        model_used=model_used,
        tokens_used=tokens,
        duration_ms=duration,
    )

    # Gamification reward
    try:
        from apps.gamification.services import (
            AchievementManager,
            BadgeAwarder,
            ChallengeManager,
            PointsManager,
        )
        PointsManager.award_points(request.user, 'lesson_created')
        request.user.lessons_created_count += 1
        request.user.save(update_fields=['lessons_created_count'])
        BadgeAwarder.check_and_award(request.user, 'lessons_created', request.user.lessons_created_count)
        AchievementManager.check_and_award(request.user, 'lessons_created')
        ChallengeManager.update_progress(request.user, 'lessons_created')
    except Exception:
        pass

    return Response(LessonPlanDetailSerializer(lesson_plan).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def duplicate_lesson_plan(request, pk):
    original = generics.get_object_or_404(LessonPlan, pk=pk, user=request.user)

    new_plan = LessonPlan.objects.create(
        user=request.user,
        title=f"{original.title} (Copy)",
        subject=original.subject,
        grade=original.grade,
        plan_data=original.plan_data,
        generated_by='duplicate',
        ai_model_used=original.ai_model_used,
    )

    return Response(LessonPlanDetailSerializer(new_plan).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refine_lesson_plan_view(request, pk):
    lesson_plan = _get_plan_or_403(pk, request)
    if lesson_plan is None:
        return Response({'error': 'You do not have permission to modify this plan'}, status=status.HTTP_403_FORBIDDEN)
    prompt = request.data.get('prompt', '').strip()
    model_id = request.data.get('model_id')

    if not prompt:
        return Response({'error': 'Refinement prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        updated_data, model_used, tokens = ai_refine(
            current_plan_data=lesson_plan.plan_data,
            refinement_prompt=prompt,
            language=request.data.get('language', 'ar'),
            model_id=model_id,
        )
    except Exception as e:
        return Response({'error': f'Failed to refine plan: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

    if 'error' in updated_data:
        return Response({'error': 'Failed to parse AI response in structured format'}, status=status.HTTP_502_BAD_GATEWAY)

    lesson_plan.plan_data = updated_data
    lesson_plan.save()

    LessonPlanRefinement.objects.create(
        lesson_plan=lesson_plan,
        user=request.user,
        user_prompt=prompt,
        ai_response=json.dumps(updated_data, ensure_ascii=False)
    )

    return Response(LessonPlanDetailSerializer(lesson_plan).data, status=status.HTTP_200_OK)

class MarketplaceListView(generics.ListAPIView):
    serializer_class = LessonPlanDetailSerializer
    queryset = LessonPlan.objects.filter(is_public=True, status='published').order_by('-likes_count', '-created_at')

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clone_marketplace_plan_view(request, pk):
    original = generics.get_object_or_404(LessonPlan, pk=pk, is_public=True)
    original.clones_count += 1
    original.save(update_fields=['clones_count'])

    cloned = LessonPlan.objects.create(
        user=request.user,
        title=f"{original.title} (Cloned)",
        subject=original.subject,
        grade=original.grade,
        plan_data=original.plan_data,
        generated_by='clone',
        ai_model_used=original.ai_model_used,
        original_plan=original,
    )
    return Response(LessonPlanDetailSerializer(cloned).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like_view(request, pk):
    plan = generics.get_object_or_404(LessonPlan, pk=pk, is_public=True)
    plan.likes_count += 1
    plan.save(update_fields=['likes_count'])
    return Response({'likes_count': plan.likes_count}, status=status.HTTP_200_OK)

@api_view(['GET'])
def smart_prompts_view(request):
    prompts = [
        {"title": _("Interactive Introduction & Brainstorming"), "prompt": _("Design a lesson plan focused on brainstorming and eliciting key concepts with enthusiasm.")},
        {"title": _("Learning through Play & Practical Experiments"), "prompt": _("Incorporate interactive activities, educational games, or simplified applied science experiments.")},
        {"title": _("Formative & Inquiry-Based Assessment"), "prompt": _("Focus on inquiry questions and continuous formative assessment to measure student understanding.")},
        {"title": _("Higher-Order Thinking Skills & Discussion"), "prompt": _("Focus on critical thinking, problem-solving, and guided group discussion.")}
    ]
    return Response(prompts, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_lesson_plan_view(request, pk):
    try:
        plan = LessonPlan.objects.get(pk=pk)
    except LessonPlan.DoesNotExist:
        return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

    if plan.user != request.user and not request.user.is_staff:
        return Response({'error': 'You do not have permission to delete this plan'}, status=status.HTTP_403_FORBIDDEN)

    plan.delete()
    return Response({'detail': 'Plan deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_public_view(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'You do not have permission to modify this plan'}, status=status.HTTP_403_FORBIDDEN)
    plan.is_public = not plan.is_public
    if plan.is_public and plan.status == 'draft':
        plan.status = 'published'
    plan.save(update_fields=['is_public', 'status'])
    return Response({'is_public': plan.is_public, 'status': plan.status}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_worksheet_view(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'You do not have permission to modify this plan'}, status=status.HTTP_403_FORBIDDEN)
    from apps.ai.router import ProviderRouter

    plan_data_json = json.dumps(plan.plan_data, ensure_ascii=False)
    sys_prompt, user_msg = PromptBuilderService.build_prompt(
        feature_key='worksheet',
        language=request.data.get('language', 'ar'),
        variables={'plan_data': plan_data_json},
        subject=plan.subject,
        grade=plan.grade,
    )
    if not sys_prompt:
        return Response({'error': 'Worksheet prompt template not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        router = ProviderRouter()
        resp = router.generate(
            prompt=user_msg or "أنشئ ورقة العمل.",
            feature="worksheet",
            system_instruction=sys_prompt,
            use_cache=False,
        )
        raw = resp.content
        if not resp.success:
            worksheet_data = {"error": resp.error}
        else:
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            worksheet_data = json.loads(raw)
    except Exception as e:
        worksheet_data = {"error": str(e)}

    plan.plan_data['worksheet'] = worksheet_data
    plan.save(update_fields=['plan_data'])
    return Response(LessonPlanDetailSerializer(plan).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_homework_view(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'You do not have permission to modify this plan'}, status=status.HTTP_403_FORBIDDEN)
    from apps.ai.router import ProviderRouter

    plan_data_json = json.dumps(plan.plan_data, ensure_ascii=False)
    sys_prompt, user_msg = PromptBuilderService.build_prompt(
        feature_key='homework',
        language=request.data.get('language', 'ar'),
        variables={'plan_data': plan_data_json},
        subject=plan.subject,
        grade=plan.grade,
    )
    if not sys_prompt:
        return Response({'error': 'Homework prompt template not found'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    try:
        router = ProviderRouter()
        resp = router.generate(
            prompt=user_msg or "أنشئ الواجب المنزلي.",
            feature="homework",
            system_instruction=sys_prompt,
            use_cache=False,
        )
        raw = resp.content
        if not resp.success:
            homework_data = {"error": resp.error}
        else:
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            homework_data = json.loads(raw)
    except Exception as e:
        homework_data = {"error": str(e)}

    plan.plan_data['homework_assignment'] = homework_data
    plan.save(update_fields=['plan_data'])
    return Response(LessonPlanDetailSerializer(plan).data, status=status.HTTP_200_OK)


# --- PDF Export ---

def _val_to_html(val) -> str:
    if isinstance(val, str):
        return ''.join(f'<p>{_e(line)}</p>' for line in val.split('\n') if line.strip())
    if isinstance(val, list):
        dict_items = [i for i in val if isinstance(i, dict)]
        str_items = [i for i in val if isinstance(i, str)]
        parts = []
        for item in dict_items:
            line = item.get('title', '')
            if item.get('description'):
                line += f'<br/>{_e(item["description"])}'
            if item.get('duration_minutes'):
                line += f'<br/><span class="badge">{item["duration_minutes"]} دقيقة</span>'
            if line:
                parts.append(f'<div class="step">{line}</div>')
        if str_items:
            lis = ''.join(f'<li>{_e(s)}</li>' for s in str_items)
            parts.append(f'<ul>{lis}</ul>')
        return ''.join(parts)
    return ''


def _e(text) -> str:
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_plan_pdf(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'Not found or no permission'}, status=status.HTTP_404_NOT_FOUND)

    locale = request.query_params.get('locale', 'ar')
    is_rtl = locale in ('ar', 'ur')

    pd = plan.plan_data
    title = _e(pd.get('title', pd.get('lesson_title', plan.title)))

    subject_str = _e(str(plan.subject)) if plan.subject else '-'
    grade_str = _e(str(plan.grade)) if plan.grade else '-'

    if is_rtl:
        meta = f'المادة: {subject_str} | الصف: {grade_str}'
        if pd.get('estimated_duration'):
            meta += f' | المدة المتوقعة: {pd["estimated_duration"]} دقيقة'
    else:
        meta = f'Subject: {subject_str} | Grade: {grade_str}'
        if pd.get('estimated_duration'):
            meta += f' | Duration: {pd["estimated_duration"]} min'
    font_url = str(FONT_DIR / 'NotoNaskhArabic-Regular.ttf')
    font_bold_url = str(FONT_DIR / 'NotoNaskhArabic-Bold.ttf')

    font_face = f'''
@font-face {{ font-family: 'Noto'; src: url('file://{font_url}') format('truetype'); font-weight: normal; }}
@font-face {{ font-family: 'Noto'; src: url('file://{font_bold_url}') format('truetype'); font-weight: bold; }}'''

    ar_sections = [
        ('objectives', 'الأهداف التعليمية'),
        ('materials_needed', 'المواد والوسائل التعليمية'),
        ('introduction', 'التمهيد والمقدمة'),
        ('main_activity', 'الأنشطة التعليمية (خطوة بخطوة)'),
        ('teaching_methods', 'طرق واستراتيجيات التدريس'),
        ('assessment', 'التقييم والقياس'),
        ('homework', 'الواجب والتطبيق المنزلي'),
    ]
    en_sections = [
        ('objectives', 'Objectives'),
        ('materials_needed', 'Materials'),
        ('introduction', 'Introduction'),
        ('main_activity', 'Procedure'),
        ('teaching_methods', 'Teaching Methods'),
        ('assessment', 'Assessment'),
        ('homework', 'Homework'),
    ]
    sections = ar_sections if is_rtl else en_sections

    body_parts = []
    for key, label in sections:
        val = pd.get(key)
        if not val:
            continue
        html = _val_to_html(val)
        if not html:
            continue
        body_parts.append(f'<div class="section"><h2>{_e(label)}</h2>{html}</div>')
    ws = pd.get('worksheet')
    if ws and isinstance(ws, dict) and not ws.get('error'):
        wst = _e(ws.get('title', 'ورقة العمل' if is_rtl else 'Worksheet'))
        wh = f'<div style="page-break-before: always; break-before: page; height: 0;"></div><div class="section"><h2>{wst}</h2>'
        if ws.get('instructions'):
            wh += f'<p class="instructions">{_e(ws["instructions"])}</p>'
        if ws.get('exercises') and isinstance(ws['exercises'], list):
            for i, ex in enumerate(ws['exercises']):
                wh += f'<div class="exercise"><p><strong>{i+1}. {_e(ex.get("question", ""))}</strong></p>'
                if ex.get('options') and isinstance(ex['options'], list):
                    wh += '<ul class="options">' + ''.join(f'<li>{_e(o)}</li>' for o in ex['options']) + '</ul>'
                wh += '</div>'
        wh += '</div>'
        body_parts.append(wh)

    ha = pd.get('homework_assignment')
    if ha and isinstance(ha, dict) and not ha.get('error'):
        hat = _e(ha.get('homework_title', 'الواجب المنزلي' if is_rtl else 'Homework Assignment'))
        hh = f'<div style="page-break-before: always; break-before: page; height: 0;"></div><div class="section"><h2>{hat}</h2>'
        if ha.get('instructions'):
            hh += f'<p class="instructions">{_e(ha["instructions"])}</p>'
        if ha.get('tasks') and isinstance(ha['tasks'], list):
            for task in ha['tasks']:
                tn = task.get('task_number', '')
                td = _e(task.get('description', ''))
                hh += f'<div class="task"><span class="task-num">{tn}.</span> {td}<div class="answer-space"></div></div>'
        hh += '</div>'
        body_parts.append(hh)


    html_str = f'''<!DOCTYPE html>
<html dir="{ "rtl" if is_rtl else "ltr" }">
<head><meta charset="utf-8">
<style>
{font_face}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: 'Noto', 'DejaVu Sans', sans-serif; font-size: 11pt; line-height: 1.7; color: #1e293b; padding: 2cm; }}
h1 {{ font-size: 18pt; font-weight: bold; margin-bottom: 8pt; color: #1e293b; }}
.meta {{ font-size: 9pt; color: #64748b; margin-bottom: 18pt; }}
.section {{ margin-bottom: 14pt; }}
h2 {{ font-size: 13pt; font-weight: bold; margin-bottom: 6pt; padding-bottom: 3pt; border-bottom: 1.5px solid #4f46e5; color: #1e293b; }}
p {{ margin-bottom: 4pt; }}
ul {{ padding-{"right" if is_rtl else "left"}: 20pt; }}
li {{ margin-bottom: 2pt; }}
.step {{ margin-bottom: 6pt; padding: 4pt 6pt; background: #f8fafc; border-radius: 4pt; }}
.badge {{ font-size: 9pt; color: #64748b; }}
.page-break {{ page-break-before: always; break-before: page; }}
.instructions {{ margin-bottom: 10pt; font-style: italic; }}
.exercise {{ margin-bottom: 10pt; padding: 8pt; border: 0.5pt solid #e2e8f0; border-radius: 4pt; }}
.exercise p {{ margin-bottom: 3pt; }}
ul.options {{ padding-{"right" if is_rtl else "left"}: 16pt; list-style: none; }}
ul.options li::before {{ content: "○ "; color: #4f46e5; }}
.answer {{ font-size: 9pt; color: #059669; margin-top: 4pt; }}
.task {{ margin-bottom: 6pt; padding: 6pt 8pt; background: #f1f5f9; border-radius: 4pt; }}
.task-num {{ font-weight: bold; color: #4f46e5; }}
.answer-space {{ height: 40pt; margin-top: 8pt; border-bottom: 0.5pt dashed #cbd5e1; }}
</style></head>
<body>
<h1>{title}</h1>
<p class="meta">{_e(meta)}</p>
{''.join(body_parts)}
</body></html>'''

    from weasyprint import HTML
    pdf_bytes = HTML(string=html_str).write_pdf()

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    safe_title = plan.title.replace('"', "'") if plan.title else "lesson-plan"
    response['Content-Disposition'] = f'attachment; filename="{safe_title}-{pk}.pdf"'
    return response



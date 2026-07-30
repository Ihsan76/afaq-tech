import json
from io import BytesIO
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from apps.ai.models import AIRun
from apps.ai.services import generate_lesson_plan as ai_generate, refine_lesson_plan as ai_refine, PromptBuilderService
from apps.academics.models import Subject, Grade, CurriculumDocument
from .models import LessonPlan, LessonPlanRefinement
from .serializers import LessonPlanSerializer, LessonPlanDetailSerializer


def _get_plan_or_403(pk, request):
    """Return plan if user is owner or admin, else 403."""
    plan = get_object_or_404(LessonPlan, pk=pk)
    if plan.user != request.user and not request.user.is_staff:
        return None
    return plan

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
    language = request.data.get('language', 'ar')
    model_id = request.data.get('model_id')

    if not title:
        return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not prompt_text:
        return Response({'error': 'Lesson description is required'}, status=status.HTTP_400_BAD_REQUEST)

    subject_obj = None
    grade_obj = None
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
        )
    except Exception as e:
        return Response({'error': f'Failed to generate plan: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

    if 'error' in plan_data:
        return Response({
            'error': 'Failed to parse AI response in structured format',
            'raw_response': plan_data.get('raw_response', ''),
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
        from apps.gamification.services import PointsManager, BadgeAwarder, AchievementManager, ChallengeManager
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_plan_pdf(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'Not found or no permission'}, status=status.HTTP_404_NOT_FOUND)

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleAr', parent=styles['Title'], fontName='Helvetica', fontSize=18, spaceAfter=12)
    heading_style = ParagraphStyle('HeadingAr', parent=styles['Heading2'], fontName='Helvetica', fontSize=14, spaceAfter=8, spaceBefore=12)
    body_style = ParagraphStyle('BodyAr', parent=styles['Normal'], fontName='Helvetica', fontSize=10, spaceAfter=6, leading=14)

    elements = []
    pd = plan.plan_data

    title = pd.get('title', pd.get('lesson_title', str(plan)))
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 0.3*cm))

    elements.append(Paragraph(f"Subject: {plan.subject}", body_style))
    elements.append(Paragraph(f"Grade: {plan.grade}", body_style))
    elements.append(Paragraph(f"Language: {plan.language}", body_style))
    elements.append(Spacer(1, 0.3*cm))

    sections = [
        ('objectives', 'Objectives'),
        ('materials', 'Materials'),
        ('procedure', 'Procedure'),
        ('assessment', 'Assessment'),
        ('homework', 'Homework'),
        ('extension', 'Extension Activities'),
    ]

    for key, label in sections:
        content = pd.get(key, '')
        if isinstance(content, list):
            content = '\n'.join(f'- {item}' for item in content)
        if content:
            elements.append(Paragraph(label, heading_style))
            for line in content.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line.strip(), body_style))

    doc.build(elements)
    pdf_bytes = buf.getvalue()
    buf.close()

    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{plan.title or "lesson-plan"}-{pk}.pdf"'
    return response



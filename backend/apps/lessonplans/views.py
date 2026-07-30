import json
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from apps.ai.models import AIRun
from apps.ai.services import generate_lesson_plan as ai_generate, refine_lesson_plan as ai_refine
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
        return Response({'error': 'العنوان مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    if not prompt_text:
        return Response({'error': 'وصف الدرس مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

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
        return Response({'error': f'فشل توليد الخطة: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    if 'error' in plan_data:
        return Response({
            'error': 'فشل تحليل رد AI بصيغة منظمة',
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
    request.user.points += 10
    request.user.lessons_created_count += 1
    if request.user.lessons_created_count >= 5 and 'pro_creator' not in request.user.badges:
        request.user.badges.append('pro_creator')
    request.user.save(update_fields=['points', 'lessons_created_count', 'badges'])

    return Response(LessonPlanDetailSerializer(lesson_plan).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def duplicate_lesson_plan(request, pk):
    original = generics.get_object_or_404(LessonPlan, pk=pk, user=request.user)
    
    new_plan = LessonPlan.objects.create(
        user=request.user,
        title=f"{original.title} (نسخة)",
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
        return Response({'error': 'ليس لديك صلاحية تعديل هذه الخطة'}, status=status.HTTP_403_FORBIDDEN)
    prompt = request.data.get('prompt', '').strip()
    model_id = request.data.get('model_id')

    if not prompt:
        return Response({'error': 'طلب التعديل مطلوب'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        updated_data, model_used, tokens = ai_refine(
            current_plan_data=lesson_plan.plan_data,
            refinement_prompt=prompt,
            language=request.data.get('language', 'ar'),
            model_id=model_id,
        )
    except Exception as e:
        return Response({'error': f'فشل تعديل الخطة: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)

    if 'error' in updated_data:
        return Response({'error': 'فشل تحليل رد AI بصيغة منظمة'}, status=status.HTTP_502_BAD_GATEWAY)

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
        title=f"{original.title} (مستنسخة)",
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
        {"title": "مقدمة تفاعلية وعصف ذهني", "prompt": "صمم خطة درس تركز على العصف الذهني واستنباط المفاهيم الأساسية بحماس."},
        {"title": "التعلم باللعب والتجارب العملية", "prompt": "أدمج أنشطة تفاعلية وألعاب تعليمية أو تجارب علمية تطبيقية مبسطة."},
        {"title": "تقييم تكويني واستقصائي", "prompt": "ركز على الأسئلة الاستقصائية والتقييم التكويني المستمر لقياس فهم الطلاب."},
        {"title": "مهارات التفكير العليا والنقاش", "prompt": "ركز على مهارات التفكير الناقد وحل المشكلات والنقاش الجماعي الموجه."}
    ]
    return Response(prompts, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_lesson_plan_view(request, pk):
    try:
        plan = LessonPlan.objects.get(pk=pk)
    except LessonPlan.DoesNotExist:
        return Response({'error': 'الخطة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)

    if plan.user != request.user and not request.user.is_staff:
        return Response({'error': 'ليس لديك صلاحية حذف هذه الخطة'}, status=status.HTTP_403_FORBIDDEN)

    plan.delete()
    return Response({'detail': 'تم حذف الخطة بنجاح'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_public_view(request, pk):
    plan = _get_plan_or_403(pk, request)
    if plan is None:
        return Response({'error': 'ليس لديك صلاحية تعديل هذه الخطة'}, status=status.HTTP_403_FORBIDDEN)
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
        return Response({'error': 'ليس لديك صلاحية تعديل هذه الخطة'}, status=status.HTTP_403_FORBIDDEN)
    from apps.ai.services import _resolve_model_and_client
    import google.generativeai as genai
    from openai import OpenAI

    provider_code, model_name, api_key, base_url = _resolve_model_and_client()
    plan_data_json = json.dumps(plan.plan_data, ensure_ascii=False)
    sys_prompt = (
        f"بناءً على خطة الدرس:\n{plan_data_json}\n\n"
        f"قم بإنشاء ورقة عمل تعليمية شاملة بصيغة JSON فقط "
        f'(بدون markdown):\n{{"title": "ورقة عمل", "instructions": "تعليمات", '
        f'"exercises": [{{"question": "...", "options": ["أ", "ب", "ج", "د"], "answer": "..."}}]}}'
    )

    try:
        if provider_code == 'google':
            genai.configure(api_key=api_key or settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(model_name, system_instruction=sys_prompt)
            res = model.generate_content("أنشئ ورقة العمل.")
            raw = res.text.strip()
        else:
            client = OpenAI(api_key=api_key or 'sk-placeholder', base_url=(base_url or '').rstrip('/') + '/v1' if base_url else None)
            res = client.chat.completions.create(model=model_name, messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": "أنشئ ورقة العمل."}])
            raw = res.choices[0].message.content.strip()

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
        return Response({'error': 'ليس لديك صلاحية تعديل هذه الخطة'}, status=status.HTTP_403_FORBIDDEN)
    from apps.ai.services import _resolve_model_and_client
    import google.generativeai as genai
    from openai import OpenAI

    provider_code, model_name, api_key, base_url = _resolve_model_and_client()
    plan_data_json = json.dumps(plan.plan_data, ensure_ascii=False)
    sys_prompt = (
        f"بناءً على خطة الدرس:\n{plan_data_json}\n\n"
        f"قم بإنشاء واجب منزلي تفصيلي بصيغة JSON فقط "
        f'(بدون markdown):\n{{"homework_title": "الواجب المنزلي", "instructions": "...", '
        f'"tasks": [{{"task_number": 1, "description": "..."}}]}}'
    )

    try:
        if provider_code == 'google':
            genai.configure(api_key=api_key or settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(model_name, system_instruction=sys_prompt)
            res = model.generate_content("أنشئ الواجب المنزلي.")
            raw = res.text.strip()
        else:
            client = OpenAI(api_key=api_key or 'sk-placeholder', base_url=(base_url or '').rstrip('/') + '/v1' if base_url else None)
            res = client.chat.completions.create(model=model_name, messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": "أنشئ الواجب المنزلي."}])
            raw = res.choices[0].message.content.strip()

        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        homework_data = json.loads(raw)
    except Exception as e:
        homework_data = {"error": str(e)}

    plan.plan_data['homework_assignment'] = homework_data
    plan.save(update_fields=['plan_data'])
    return Response(LessonPlanDetailSerializer(plan).data, status=status.HTTP_200_OK)



from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import LessonPlan
from .serializers import LessonPlanSerializer, LessonPlanDetailSerializer

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
    serializer = LessonPlanSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    lesson_plan = serializer.save(
        user=request.user,
        generated_by='ai',
        ai_model_used='gemini-pro'
    )
    
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

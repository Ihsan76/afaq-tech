from rest_framework import serializers
from .models import LessonPlan

class LessonPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPlan
        fields = ['id', 'title', 'subject', 'grade', 'plan_data', 'generated_by', 
                  'ai_model_used', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'generated_by', 'ai_model_used']

class LessonPlanDetailSerializer(LessonPlanSerializer):
    subject_name = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    
    class Meta(LessonPlanSerializer.Meta):
        fields = LessonPlanSerializer.Meta.fields + ['subject_name', 'grade_name']

    def get_subject_name(self, obj):
        return obj.subject.translations.get('ar', {}).get('name', '') if obj.subject else ''

    def get_grade_name(self, obj):
        return obj.grade.translations.get('ar', {}).get('name', '') if obj.grade else ''

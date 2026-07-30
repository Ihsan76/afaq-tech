from rest_framework import serializers
from apps.core.translations import get_translation
from .models import LessonPlan

class LessonPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonPlan
        fields = ['id', 'title', 'subject', 'grade', 'plan_data', 'generated_by', 
                  'ai_model_used', 'status', 'is_public', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'generated_by', 'ai_model_used']

class LessonPlanDetailSerializer(LessonPlanSerializer):
    subject_name = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    
    class Meta(LessonPlanSerializer.Meta):
        fields = LessonPlanSerializer.Meta.fields + ['subject_name', 'grade_name', 'user_name']

    def _get_locale(self):
        request = self.context.get('request')
        if request:
            return getattr(request, 'LANGUAGE_CODE', 'ar') or 'ar'
        return 'ar'

    def get_subject_name(self, obj):
        if not obj.subject:
            return ''
        loc = self._get_locale()
        return get_translation(obj.subject.translations, loc, 'name', '')

    def get_grade_name(self, obj):
        if not obj.grade:
            return ''
        loc = self._get_locale()
        return get_translation(obj.grade.translations, loc, 'name', '')

    def get_user_name(self, obj):
        if not obj.user:
            return ''
        loc = self._get_locale()
        name = get_translation(obj.user.translations, loc, 'name', '')
        return name or obj.user.email

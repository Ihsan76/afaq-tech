from rest_framework import serializers
from .models import Grade, Subject, Curriculum, Unit, CurriculumDocument
from apps.core.translations import get_translation


def _locale(request):
    if request is None:
        return 'en'
    if hasattr(request, 'query_params'):
        return request.query_params.get('locale', 'en')
    if hasattr(request, 'GET'):
        return request.GET.get('locale', 'en')
    return 'en'


class GradeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = ['id', 'name', 'level', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')


class SubjectSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'icon', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')


class UnitSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'name', 'order', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')


class CurriculumSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Curriculum
        fields = ['id', 'name', 'country', 'year', 'grade', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')


class CurriculumDetailSerializer(CurriculumSerializer):
    units = UnitSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()

    class Meta(CurriculumSerializer.Meta):
        fields = CurriculumSerializer.Meta.fields + ['units', 'documents']

    def get_documents(self, obj):
        docs = CurriculumDocument.objects.filter(curriculum=obj)
        return CurriculumDocumentSerializer(docs, many=True).data


class CurriculumDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumDocument
        fields = ['id', 'curriculum', 'subject', 'title', 'file', 'extracted_text', 'created_at']
        read_only_fields = ['extracted_text', 'created_at']

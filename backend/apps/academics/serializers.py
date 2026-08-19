from django.urls import reverse
from rest_framework import serializers

from apps.core.translations import get_translation

from .models import AcademicTrack, Curriculum, CurriculumDocument, Grade, Subject, Unit


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
    tracks = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = ['id', 'name', 'level', 'has_tracks', 'tracks', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')

    def get_tracks(self, obj):
        if not obj.has_tracks:
            return []
        tracks = obj.tracks.filter(is_active=True).order_by('order')
        return AcademicTrackSerializer(tracks, many=True, context=self.context).data


class AcademicTrackSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = AcademicTrack
        fields = ['id', 'name', 'code', 'grade', 'country', 'year', 'is_active', 'order', 'translations']

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
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = ['id', 'name', 'subject', 'subject_name', 'order', 'outcomes', 'content', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')

    def get_subject_name(self, obj):
        if not obj.subject:
            return ''
        loc = _locale(self.context.get('request'))
        return get_translation(obj.subject.translations, loc, 'name', '')


class CurriculumSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    grade_name = serializers.SerializerMethodField()
    track_name = serializers.SerializerMethodField()

    class Meta:
        model = Curriculum
        fields = ['id', 'name', 'country', 'year', 'grade', 'grade_name', 'track', 'track_name', 'translations']

    def get_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.translations, loc, 'name', '')

    def get_grade_name(self, obj):
        loc = _locale(self.context.get('request'))
        return get_translation(obj.grade.translations, loc, 'name', '')

    def get_track_name(self, obj):
        if not obj.track:
            return ''
        loc = _locale(self.context.get('request'))
        return get_translation(obj.track.translations, loc, 'name', '')


class CurriculumDetailSerializer(CurriculumSerializer):
    units = UnitSerializer(many=True, read_only=True)
    documents = serializers.SerializerMethodField()

    class Meta(CurriculumSerializer.Meta):
        fields = CurriculumSerializer.Meta.fields + ['units', 'documents']

    def get_documents(self, obj):
        docs = CurriculumDocument.objects.filter(curriculum=obj)
        return CurriculumDocumentSerializer(docs, many=True).data


class CurriculumDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumDocument
        fields = ['id', 'curriculum', 'subject', 'title', 'file', 'external_url', 'extracted_text', 'download_url', 'created_at']
        read_only_fields = ['extracted_text', 'created_at']

    def get_download_url(self, obj):
        request = self.context.get('request')
        url = reverse('document-download', args=[obj.pk])
        if request is not None:
            return request.build_absolute_uri(url)
        return url

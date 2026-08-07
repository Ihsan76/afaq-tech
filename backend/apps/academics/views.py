from django.http import FileResponse, Http404
from django.shortcuts import redirect
from rest_framework import generics, parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsContentAdmin

from .extraction import extract_text
from .models import Curriculum, CurriculumDocument, Grade, Subject, Unit
from .serializers import (
    CurriculumDetailSerializer,
    CurriculumDocumentSerializer,
    CurriculumSerializer,
    GradeSerializer,
    SubjectSerializer,
    UnitSerializer,
)


class GradeListView(generics.ListAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.AllowAny]


class GradeCreateView(generics.CreateAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsContentAdmin]


class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsContentAdmin]


class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class SubjectCreateView(generics.CreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsContentAdmin]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsContentAdmin]


class CurriculumListView(generics.ListAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [permissions.AllowAny]


class CurriculumCreateView(generics.CreateAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [IsContentAdmin]


class CurriculumDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumDetailSerializer
    permission_classes = [IsContentAdmin]


class UnitListView(generics.ListAPIView):
    serializer_class = UnitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        curriculum_id = self.kwargs.get('curriculum_id')
        return Unit.objects.filter(curriculum_id=curriculum_id)


class UnitCreateView(generics.CreateAPIView):
    serializer_class = UnitSerializer
    permission_classes = [IsContentAdmin]

    def perform_create(self, serializer):
        curriculum_id = self.kwargs.get('curriculum_id')
        serializer.save(curriculum_id=curriculum_id)


class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsContentAdmin]


class CurriculumDocumentListView(generics.ListAPIView):
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [IsContentAdmin]

    def get_queryset(self):
        curriculum_id = self.kwargs.get('curriculum_id')
        return CurriculumDocument.objects.filter(curriculum_id=curriculum_id)


class PublicCurriculumDocumentListView(generics.ListAPIView):
    """Public: list curriculum documents for a subject (optionally a curriculum)."""
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = CurriculumDocument.objects.select_related('curriculum', 'subject').defer('extracted_text').all()
        subject_id = self.request.query_params.get('subject')
        curriculum_id = self.request.query_params.get('curriculum')
        grade_id = self.request.query_params.get('grade')
        country = self.request.query_params.get('country')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if curriculum_id:
            qs = qs.filter(curriculum_id=curriculum_id)
        if grade_id:
            qs = qs.filter(curriculum__grade_id=grade_id)
        if country:
            qs = qs.filter(curriculum__country__icontains=country)
        return qs.order_by('-created_at')


class CurriculumDocumentDownloadView(APIView):
    """Public: preview/download the document (redirects to the official site when linked externally)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            doc = CurriculumDocument.objects.get(pk=pk)
        except CurriculumDocument.DoesNotExist:
            raise Http404('Document not found')
        if doc.external_url:
            url = doc.external_url
            if request.query_params.get('download') == '1' and 'download=' not in url:
                url += ('&' if '?' in url else '?') + 'download=1'
            return redirect(url)
        try:
            file_handle = doc.file.open('rb')
        except FileNotFoundError:
            raise Http404('File missing on disk')
        response = FileResponse(file_handle)
        as_attachment = request.query_params.get('download') == '1'
        response['Content-Disposition'] = f'{ "attachment" if as_attachment else "inline" }; filename="{doc.file.name.split("/")[-1]}"'
        return response


class CurriculumDocumentCreateView(generics.CreateAPIView):
    queryset = CurriculumDocument.objects.all()
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [IsContentAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class CurriculumDocumentDetailView(generics.RetrieveDestroyAPIView):
    queryset = CurriculumDocument.objects.all()
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [IsContentAdmin]


class CurriculumDocumentExtractView(APIView):
    permission_classes = [IsContentAdmin]

    def post(self, request, pk):
        try:
            doc = CurriculumDocument.objects.get(pk=pk)
        except CurriculumDocument.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        extracted = extract_text(doc)
        if not extracted:
            return Response({"error": "No text could be extracted from this file"}, status=status.HTTP_400_BAD_REQUEST)
        doc.extracted_text = extracted
        doc.save(update_fields=["extracted_text"])
        return Response({"id": doc.id, "extracted_text": doc.extracted_text})


class CurriculumResolveView(generics.ListAPIView):
    """Resolve official curriculum + units for a given grade and subject."""
    serializer_class = CurriculumDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        grade_id = self.request.query_params.get('grade')
        country = self.request.query_params.get('country', '').strip()
        qs = Curriculum.objects.all().order_by('-year', '-id')
        if grade_id:
            qs = qs.filter(grade_id=grade_id)
        if country:
            qs = qs.filter(country=country)
        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        subject_id = request.query_params.get('subject')
        curricula = list(queryset[:5])

        units_serializer = None
        if curricula and subject_id:
            units = Unit.objects.filter(curriculum_id__in=[c.id for c in curricula], subject_id=subject_id).order_by('order')
            units_serializer = UnitSerializer(units, many=True, context={'request': request}).data

        data = CurriculumDetailSerializer(curricula, many=True, context={'request': request}).data
        if units_serializer is not None:
            for item in data:
                item['units'] = units_serializer
        return Response({"results": data, "units": units_serializer})

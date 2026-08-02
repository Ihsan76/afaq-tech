from rest_framework import generics, parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
    permission_classes = [permissions.IsAdminUser]


class GradeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAdminUser]


class SubjectListView(generics.ListAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class SubjectCreateView(generics.CreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAdminUser]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAdminUser]


class CurriculumListView(generics.ListAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [permissions.AllowAny]


class CurriculumCreateView(generics.CreateAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumSerializer
    permission_classes = [permissions.IsAdminUser]


class CurriculumDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Curriculum.objects.all()
    serializer_class = CurriculumDetailSerializer
    permission_classes = [permissions.IsAdminUser]


class UnitListView(generics.ListAPIView):
    serializer_class = UnitSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        curriculum_id = self.kwargs.get('curriculum_id')
        return Unit.objects.filter(curriculum_id=curriculum_id)


class UnitCreateView(generics.CreateAPIView):
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        curriculum_id = self.kwargs.get('curriculum_id')
        serializer.save(curriculum_id=curriculum_id)


class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAdminUser]


class CurriculumDocumentListView(generics.ListAPIView):
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        curriculum_id = self.kwargs.get('curriculum_id')
        return CurriculumDocument.objects.filter(curriculum_id=curriculum_id)


class CurriculumDocumentCreateView(generics.CreateAPIView):
    queryset = CurriculumDocument.objects.all()
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]


class CurriculumDocumentDetailView(generics.RetrieveDestroyAPIView):
    queryset = CurriculumDocument.objects.all()
    serializer_class = CurriculumDocumentSerializer
    permission_classes = [permissions.IsAdminUser]


class CurriculumDocumentExtractView(APIView):
    permission_classes = [permissions.IsAdminUser]

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

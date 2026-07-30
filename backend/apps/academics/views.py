from rest_framework import generics, permissions, parsers
from .models import Grade, Subject, Curriculum, Unit, CurriculumDocument
from .serializers import GradeSerializer, SubjectSerializer, CurriculumSerializer, CurriculumDetailSerializer, UnitSerializer, CurriculumDocumentSerializer


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

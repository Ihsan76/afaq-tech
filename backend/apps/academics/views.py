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

            # Check if external URL is reachable, fallback to extracted text view if 500/error occurs
            try:
                import requests
                resp = requests.head(url, timeout=2, allow_redirects=True, headers={'User-Agent': 'Mozilla/5.0'})
                if resp.status_code >= 400:
                    raise Exception(f"External status {resp.status_code}")
            except Exception:
                if doc.extracted_text:
                    from django.http import HttpResponse
                    html = f"""
                    <html dir="rtl">
                    <head><title>{doc.title}</title>
                    <style>body{{font-family:Tahoma,sans-serif;padding:30px;background:#f9fafb;color:#1f2937;}}
                    .box{{background:#fff;padding:25px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:900px;margin:auto;}}
                    .alert{{background:#fffbeb;border:1px solid #f59e0b;color:#b45309;padding:15px;border-radius:10px;margin-bottom:20px;font-size:14px;line-height:1.6;}}
                    h2{{margin-top:0;color:#111827;}}
                    pre{{white-space:pre-wrap;background:#f3f4f6;padding:20px;border-radius:12px;max-height:600px;overflow:auto;font-size:13px;line-height:1.7;color:#374151;}}
                    .btn{{display:inline-block;margin-top:15px;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;}}
                    </style></head>
                    <body>
                    <div class="box">
                    <div class="alert">
                    <strong>⚠️ تنبيه:</strong> رابط المصدر الخارجي الرسمي (موقع عين / وزارة التعليم) غير متاح مؤقتاً من المصدر (خطأ 500 أو انقطاع في الخادم الخارجي). 
                    ولكن اطمئن، <strong>محتوى المنهاج مستخرج بالكامل ومحفوظ في منصة آفاق</strong> ويمكنك استخدامه لتوليد خطط الدروس والأنشطة بكل دقة.
                    </div>
                    <h2>{doc.title}</h2>
                    <p style="color:#6b7280;font-size:13px;">الرابط الأصلي المتعذر الوصول إليه: <a href="{url}" target="_blank" style="color:#2563eb;">{url}</a></p>
                    <h3 style="margin-top:20px;font-size:16px;">محتوى المنهاج المستخرج:</h3>
                    <pre>{doc.extracted_text}</pre>
                    <a href="javascript:history.back()" class="btn">العودة للخلف</a>
                    </div></body></html>
                    """
                    return HttpResponse(html)

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

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Language, TranslationKey, FeatureFlag
from .serializers import LanguageSerializer, TranslationSerializer, FeatureFlagSerializer


class LanguagePublicListView(generics.ListAPIView):
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LanguageAdminListView(generics.ListAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class LanguageAdminCreateView(generics.CreateAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAdminUser]


class LanguageAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def language_delete(request, pk):
    language = get_object_or_404(Language, pk=pk)
    if language.is_default:
        return Response(
            {'error': 'لا يمكن حذف اللغة الافتراضية'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    language.delete()
    return Response({'status': 'deleted'})


class TranslationPublicListView(generics.ListAPIView):
    queryset = TranslationKey.objects.filter(is_active=True)
    serializer_class = TranslationSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class TranslationAdminListView(generics.ListAPIView):
    serializer_class = TranslationSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

    def get_queryset(self):
        qs = TranslationKey.objects.all()
        namespace = self.request.query_params.get('namespace', '')
        q = self.request.query_params.get('q', '')
        if namespace:
            qs = qs.filter(namespace=namespace)
        if q:
            qs = qs.filter(key__icontains=q)
        return qs


class TranslationAdminCreateView(generics.CreateAPIView):
    queryset = TranslationKey.objects.all()
    serializer_class = TranslationSerializer
    permission_classes = [permissions.IsAdminUser]


class TranslationAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = TranslationKey.objects.all()
    serializer_class = TranslationSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def translation_delete(request, pk):
    translation = get_object_or_404(TranslationKey, pk=pk)
    translation.delete()
    return Response({'status': 'deleted'})


class FeatureFlagPublicListView(generics.ListAPIView):
    queryset = FeatureFlag.objects.filter(is_active=True)
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class FeatureFlagAdminListView(generics.ListAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None


class FeatureFlagAdminCreateView(generics.CreateAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.IsAdminUser]


class FeatureFlagAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['DELETE'])
@permission_classes([permissions.IsAdminUser])
def feature_flag_delete(request, pk):
    flag = get_object_or_404(FeatureFlag, pk=pk)
    flag.delete()
    return Response({'status': 'deleted'})

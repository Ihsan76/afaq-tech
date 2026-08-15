from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.marketplace.payments import PaymentProviderError, get_provider
from apps.users.permissions import IsContentAdmin

from .models import Ebook, EbookCategory, EbookPurchase
from .serializers import (
    EbookCategorySerializer,
    EbookCreateUpdateSerializer,
    EbookDetailSerializer,
    EbookListSerializer,
)

PLAN_LEVELS = {'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3}


class EbookCategoryListView(generics.ListAPIView):
    serializer_class = EbookCategorySerializer
    permission_classes = [permissions.AllowAny]
    queryset = EbookCategory.objects.filter(is_active=True)


class EbookListView(generics.ListAPIView):
    serializer_class = EbookListSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        qs = Ebook.objects.filter(is_published=True).select_related('category')
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        featured = self.request.query_params.get('featured')
        if featured == 'true':
            qs = qs.filter(is_featured=True)
        access = self.request.query_params.get('access')
        if access:
            qs = qs.filter(access_level=access)
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(translations__en__title__icontains=search) |
                Q(translations__en__description__icontains=search) |
                Q(translations__ar__title__icontains=search) |
                Q(translations__ar__description__icontains=search) |
                Q(slug__icontains=search) |
                Q(tags__icontains=search)
            )
        return qs


class EbookDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        ebook = get_object_or_404(Ebook, slug=slug, is_published=True)
        serializer = EbookDetailSerializer(ebook, context={'request': request})
        return Response(serializer.data)


class EbookDownloadView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        ebook = get_object_or_404(Ebook, slug=slug, is_published=True)

        user_level = 0
        if request.user and request.user.is_authenticated:
            user_level = request.user.get_subscription_level() if hasattr(request.user, 'get_subscription_level') else PLAN_LEVELS.get(request.user.subscription_plan, 0)
            purchased = EbookPurchase.objects.filter(
                user=request.user, ebook=ebook, status=EbookPurchase.Status.PAID
            ).exists()
            if purchased:
                user_level = 999

        required_level = PLAN_LEVELS.get(ebook.access_level, 0)
        if user_level < required_level:
            return Response(
                {'success': False, 'message': 'Subscription required', 'required_level': ebook.access_level},
                status=status.HTTP_403_FORBIDDEN
            )

        ebook.download_count += 1
        ebook.save(update_fields=['download_count'])
        return Response({'success': True, 'file_url': ebook.file_url})


class EbookPurchaseCreateView(APIView):
    """إنشاء شراء كتاب (مدى الحياة) — يعيد رابط الدفع"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        ebook = get_object_or_404(Ebook, slug=slug, is_published=True)
        if ebook.is_free:
            return Response(
                {'error': 'This ebook is free — no purchase needed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = EbookPurchase.objects.filter(user=request.user, ebook=ebook).first()
        if existing and existing.status == EbookPurchase.Status.PAID:
            return Response(
                {'error': 'already_owned', 'is_purchased': True},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing and existing.status == EbookPurchase.Status.PENDING:
            purchase = existing
        else:
            purchase = EbookPurchase.objects.create(
                user=request.user,
                ebook=ebook,
                price_paid=ebook.price,
                currency='JOD',
                display_price=ebook.price,
                display_currency='JOD',
            )

        locale = request.query_params.get('locale', 'en')
        try:
            provider = get_provider()
            result = provider.create_checkout(purchase, locale)
        except PaymentProviderError:
            return Response(
                {
                    'payment_available': False,
                    'checkout_url': None,
                    'purchase_id': purchase.id,
                },
                status=status.HTTP_201_CREATED,
            )

        purchase.payment_provider = result.provider
        purchase.payment_session_id = result.session_id
        purchase.save(update_fields=['payment_provider', 'payment_session_id', 'updated_at'])
        return Response(
            {
                'payment_available': True,
                'checkout_url': result.checkout_url,
                'session_id': result.session_id,
                'purchase_id': purchase.id,
            },
            status=status.HTTP_201_CREATED,
        )


class EbookAdminListView(generics.ListAPIView):
    serializer_class = EbookListSerializer
    permission_classes = [IsContentAdmin]
    queryset = Ebook.objects.all()

    def get_serializer_context(self):
        return {'request': self.request}


class EbookAdminCreateView(generics.CreateAPIView):
    serializer_class = EbookCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class EbookAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Ebook.objects.all()
    serializer_class = EbookDetailSerializer
    permission_classes = [IsContentAdmin]

    def get_serializer_context(self):
        return {'request': self.request}


class EbookAdminDeleteView(generics.DestroyAPIView):
    queryset = Ebook.objects.all()
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminCreateView(generics.CreateAPIView):
    serializer_class = EbookCategorySerializer
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminUpdateView(generics.RetrieveUpdateAPIView):
    queryset = EbookCategory.objects.all()
    serializer_class = EbookCategorySerializer
    permission_classes = [IsContentAdmin]


class EbookCategoryAdminDeleteView(generics.DestroyAPIView):
    queryset = EbookCategory.objects.all()
    permission_classes = [IsContentAdmin]

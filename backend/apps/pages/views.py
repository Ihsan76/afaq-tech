from django.shortcuts import get_object_or_404
from django.core.cache import cache
from rest_framework import generics, permissions, status
from apps.users.permissions import IsContentAdmin
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.cache import SITE_CACHE_TTL, _public_key

from .models import (
    ContactMessage,
    MenuItem,
    NewsletterSubscriber,
    Page,
    PageBlock,
    PageTemplate,
    SiteSettings,
)
from .serializers import (
    BlockCreateUpdateSerializer,
    BlockSerializer,
    ContactMessageCreateSerializer,
    ContactMessageListSerializer,
    MenuItemCreateUpdateSerializer,
    MenuItemListSerializer,
    MenuItemSerializer,
    NewsletterSubscriberListSerializer,
    NewsletterSubscribeSerializer,
    PageCreateUpdateSerializer,
    PageDetailSerializer,
    PageListSerializer,
    PageTemplateListSerializer,
    PageTemplateSerializer,
    SiteSettingsSerializer,
)

# ═══════════════════════════════════════════════════════════════
# Page Views
# ═══════════════════════════════════════════════════════════════

class PagePublicView(APIView):
    """جلب صفحة بالرابط slug — الرد مُخزّن في Redis لكل (slug, locale)"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('page', slug, locale)
        data = cache.get(key)
        if data is None:
            page = get_object_or_404(Page, slug=slug, is_published=True)
            serializer = PageDetailSerializer(page, context={'request': request})
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class PageAdminListView(generics.ListAPIView):
    """قائمة الصفحات — للإدارة"""
    serializer_class = PageListSerializer
    permission_classes = [IsContentAdmin]
    pagination_class = None

    def get_queryset(self):
        return Page.objects.all()


class PageAdminCreateView(generics.CreateAPIView):
    """إنشاء صفحة جديدة"""
    serializer_class = PageCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class PageAdminUpdateView(generics.RetrieveUpdateAPIView):
    """جلب / تعديل صفحة"""
    queryset = Page.objects.all()
    serializer_class = PageDetailSerializer
    permission_classes = [IsContentAdmin]


class PageAdminDeleteView(generics.DestroyAPIView):
    """حذف صفحة"""
    queryset = Page.objects.all()
    permission_classes = [IsContentAdmin]


# ═══════════════════════════════════════════════════════════════
# Block Views
# ═══════════════════════════════════════════════════════════════

class BlockListCreateView(APIView):
    """جلب بلوكات الصفحة + إضافة بلوك جديد"""
    permission_classes = [IsContentAdmin]

    def get(self, request, page_id):
        page = get_object_or_404(Page, pk=page_id)
        blocks = page.blocks.all().order_by('order')
        serializer = BlockSerializer(blocks, many=True)
        return Response(serializer.data)

    def post(self, request, page_id):
        page = get_object_or_404(Page, pk=page_id)
        serializer = BlockCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(page=page)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BlockUpdateDeleteView(APIView):
    """تعديل / حذف بلوك"""
    permission_classes = [IsContentAdmin]

    def put(self, request, page_id, pk):
        block = get_object_or_404(PageBlock, pk=pk, page_id=page_id)
        serializer = BlockCreateUpdateSerializer(block, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, page_id, pk):
        block = get_object_or_404(PageBlock, pk=pk, page_id=page_id)
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BlockReorderView(APIView):
    """إعادة ترتيب البلوكات"""
    permission_classes = [IsContentAdmin]

    def put(self, request, page_id):
        page = get_object_or_404(Page, pk=page_id)
        order = request.data.get('order', [])
        # order should be [{"id": 1, "order": 0}, {"id": 2, "order": 1}, ...]
        for item in order:
            PageBlock.objects.filter(pk=item['id'], page=page).update(order=item['order'])
        return Response({"status": "ok"})


# ═══════════════════════════════════════════════════════════════
# Menu Views
# ═══════════════════════════════════════════════════════════════

class MenuPublicView(APIView):
    """جلب قائمة بالنوع (header/footer/sidebar) — الرد مُخزّن في Redis"""
    permission_classes = [permissions.AllowAny]

    def get(self, request, menu_type):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('menu', menu_type, locale)
        data = cache.get(key)
        if data is None:
            items = MenuItem.objects.filter(menu=menu_type, is_active=True, parent=None).order_by('order')
            serializer = MenuItemSerializer(items, many=True, context={'request': request})
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class MenuAdminListView(generics.ListAPIView):
    """قائمة العناصر — للإدارة"""
    serializer_class = MenuItemListSerializer
    permission_classes = [IsContentAdmin]

    def get_queryset(self):
        menu_type = self.request.query_params.get('menu', 'header')
        return MenuItem.objects.filter(menu=menu_type, parent=None).order_by('order')


class MenuAdminCreateView(generics.CreateAPIView):
    """إضافة عنصر قائمة"""
    serializer_class = MenuItemCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class MenuAdminUpdateView(generics.UpdateAPIView):
    """تعديل عنصر قائمة"""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemCreateUpdateSerializer
    permission_classes = [IsContentAdmin]


class MenuAdminDeleteView(generics.DestroyAPIView):
    """حذف عنصر قائمة"""
    queryset = MenuItem.objects.all()
    permission_classes = [IsContentAdmin]


class MenuReorderView(APIView):
    """إعادة ترتيب عناصر القائمة"""
    permission_classes = [IsContentAdmin]

    def put(self, request):
        order = request.data.get('order', [])
        menu_type = request.data.get('menu', 'header')
        for item in order:
            MenuItem.objects.filter(pk=item['id'], menu=menu_type).update(order=item['order'])
        return Response({"status": "ok"})


# ═══════════════════════════════════════════════════════════════
# Template Views
# ═══════════════════════════════════════════════════════════════

class TemplateListView(APIView):
    """قائمة القوالب — الرد مُخزّن في Redis"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('templates', locale)
        data = cache.get(key)
        if data is None:
            serializer = PageTemplateListSerializer(
                PageTemplate.objects.filter(is_active=True), many=True, context={'request': request}
            )
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class TemplateAdminListView(generics.ListAPIView):
    """قائمة القوالب — للإدارة"""
    serializer_class = PageTemplateSerializer
    permission_classes = [IsContentAdmin]
    pagination_class = None

    def get_queryset(self):
        return PageTemplate.objects.all()


class TemplateAdminCreateView(generics.CreateAPIView):
    """إنشاء قالب"""
    serializer_class = PageTemplateSerializer
    permission_classes = [IsContentAdmin]


class TemplateAdminUpdateView(generics.UpdateAPIView):
    """تعديل قالب"""
    queryset = PageTemplate.objects.all()
    serializer_class = PageTemplateSerializer
    permission_classes = [IsContentAdmin]


class TemplateAdminDeleteView(generics.DestroyAPIView):
    """حذف قالب"""
    queryset = PageTemplate.objects.all()
    permission_classes = [IsContentAdmin]


# ═══════════════════════════════════════════════════════════════
# Site Settings Views
# ═══════════════════════════════════════════════════════════════

class SiteSettingsPublicView(APIView):
    """جلب إعدادات الموقع — الرد مُخزّن في Redis"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        locale = request.query_params.get('locale', 'en')
        key = _public_key('site-settings', locale)
        data = cache.get(key)
        if data is None:
            settings = SiteSettings.load()
            serializer = SiteSettingsSerializer(settings, context={'request': request})
            data = serializer.data
            cache.set(key, data, SITE_CACHE_TTL)
        return Response(data)


class SiteSettingsAdminView(APIView):
    """تعديل إعدادات الموقع"""
    permission_classes = [IsContentAdmin]

    def put(self, request):
        settings = SiteSettings.load()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ═══════════════════════════════════════════════════════════════
# Contact Views
# ═══════════════════════════════════════════════════════════════

class ContactMessageCreateView(generics.CreateAPIView):
    """إرسال رسالة تواصل"""
    serializer_class = ContactMessageCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        msg = serializer.save()
        msg.ip_address = self._get_client_ip(request)
        msg.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
        msg.save()

        # Notify admin email (from SiteSettings) — fails silently
        try:
            from apps.core.email import contact_notification_email, send_email

            from .models import SiteSettings
            admin_email = SiteSettings.load().email
            if admin_email:
                send_email(
                    to=admin_email,
                    subject=f"رسالة تواصل جديدة — {msg.name}",
                    html=contact_notification_email(
                        name=msg.name, email=msg.email, phone=msg.phone,
                        subject=msg.subject, message=msg.message,
                        service=msg.service_interest,
                    ),
                )
        except Exception:
            pass

        return Response({'success': True, 'message': 'Message sent successfully'}, status=status.HTTP_201_CREATED)

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class ContactMessageAdminListView(generics.ListAPIView):
    """قائمة رسائل التواصل — للإدارة"""
    serializer_class = ContactMessageListSerializer
    permission_classes = [IsContentAdmin]
    queryset = ContactMessage.objects.all()


class ContactMessageAdminUpdateView(generics.RetrieveUpdateAPIView):
    """تعديل حالة رسالة التواصل"""
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageListSerializer
    permission_classes = [IsContentAdmin]


# ═══════════════════════════════════════════════════════════════
# Newsletter Views
# ═══════════════════════════════════════════════════════════════

class NewsletterSubscribeView(APIView):
    """الاشتراك في النشرة البريدية"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        sub, created = NewsletterSubscriber.objects.get_or_create(
            email=email,
            defaults={
                'name': serializer.validated_data.get('name', ''),
                'locale': serializer.validated_data.get('locale', 'ar'),
                'ip_address': request.META.get('REMOTE_ADDR'),
            }
        )
        if not created and sub.status == 'unsubscribed':
            sub.status = 'active'
            sub.save()
        return Response({'success': True, 'message': 'Subscribed successfully'}, status=status.HTTP_201_CREATED)


class NewsletterAdminListView(generics.ListAPIView):
    """قائمة المشتركين — للإدارة"""
    serializer_class = NewsletterSubscriberListSerializer
    permission_classes = [IsContentAdmin]
    queryset = NewsletterSubscriber.objects.all()

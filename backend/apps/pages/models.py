from django.contrib.postgres.fields import ArrayField
from django.db import models


class Page(models.Model):
    """صفحة — يمكن أن تكون صفحة رئيسية أو مخصصة"""

    class Template(models.TextChoices):
        DEFAULT = 'default', 'افتراضي'
        LANDING = 'landing', 'صفحة هبوط'
        ABOUT = 'about', 'من نحن'
        CONTACT = 'contact', 'تواصل معنا'
        CUSTOM = 'custom', 'مخصص'

    slug = models.SlugField('الرابط', unique=True, max_length=100)
    translations = models.JSONField('الترجمات', default=dict, blank=True)

    template = models.CharField('القالب', max_length=20, choices=Template.choices, default=Template.DEFAULT)

    # SEO

    # Navigation
    show_in_nav = models.BooleanField('إظهار في القائمة', default=False)
    nav_order = models.IntegerField('ترتيب القائمة', default=0)
    parent_page = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='children', verbose_name='الصفحة الأب')
    nav_icon = models.CharField('أيقونة القائمة', max_length=10, blank=True, default='')

    # Page settings
    layout_config = models.JSONField('تخطيط الصفحة', default=dict, blank=True)
    # مثال: {"max_width": "1200px", "padding": "2rem", "background": "var(--color-background)"}

    is_published = models.BooleanField('منشورة', default=True)
    is_homepage = models.BooleanField('الصفحة الرئيسية', default=False)

    # Page-level theme overrides
    theme_overrides = models.JSONField('تخصيص الثيم', default=dict, blank=True)
    # مثال: {"primary": "#FF0000", "background": "#000000"}

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nav_order', 'slug']
        verbose_name = 'صفحة'
        verbose_name_plural = 'الصفحات'

    def __str__(self):
        return self.translations.get('ar', {}).get('title', self.slug)


class PageBlock(models.Model):
    """بلوك داخل صفحة"""

    class BlockType(models.TextChoices):
        HERO = 'hero', 'بطل الصفحة'
        PLATFORM_HERO = 'platform_hero', 'بطل الصفحة (المنصة)'
        STATS = 'stats', 'إحصائيات'
        PLATFORM_STATS = 'platform_stats', 'إحصائيات (المنصة)'
        FEATURES = 'features', 'الميزات'
        HOW_IT_WORKS = 'how_it_works', 'كيف يعمل'
        PLATFORM_HOW_IT_WORKS = 'platform_how_it_works', 'كيف تعمل (المنصة)'
        SERVICES_SHOWCASE = 'services_showcase', 'عرض الخدمات'
        DEMO = 'demo', 'عرض توضيحي'
        TESTIMONIALS = 'testimonials', 'شهادات'
        PRICING = 'pricing', 'التسعير'
        FAQ = 'faq', 'أسئلة شائعة'
        CTA = 'cta', 'دعوة للعمل'
        TEXT = 'text', 'نص'
        IMAGE = 'image', 'صورة'
        VIDEO = 'video', 'فيديو'
        GALLERY = 'gallery', 'معرض صور'
        CONTACT = 'contact', 'تواصل معنا'
        FORM = 'form', 'نموذج'
        SPACER = 'spacer', 'مسافة'
        DIVIDER = 'divider', 'فاصل'
        SERVICES = 'services', 'خدمات'
        PORTFOLIO = 'portfolio', 'معرض أعمال'
        TEAM = 'team', 'الفريق'
        PARTNERS = 'partners', 'الشركاء'
        GRADE_SHOWCASE = 'grade_showcase', 'عرض الصفوف'
        SUBJECTS_GRID = 'subjects_grid', 'شبكة المواد'
        ACCORDION = 'accordion', 'أقسام قابلة للطي'
        TABS = 'tabs', 'تبويبات'
        TIMELINE = 'timeline', 'خط زمني'
        COUNTDOWN = 'countdown', 'عداد تنازلي'
        NEWSLETTER = 'newsletter', 'اشتراك بريد'
        MAP = 'map', 'خريطة'
        TABLE = 'table', 'جدول بيانات'
        ICON_LIST = 'icon_list', 'قائمة أيقونات'
        LOGO_CAROUSEL = 'logo_carousel', 'كاروسيل شعارات'
        DOWNLOAD = 'download', 'تحميل ملف'
        CODE = 'code', 'بلوك كود'
        CUSTOM_HTML = 'custom_html', 'HTML مخصص'
        BLOG_LIST = 'blog_list', 'قائمة المدونة'
        COURSES_LIST = 'courses_list', 'قائمة الدورات المختارة'

    page = models.ForeignKey(Page, on_delete=models.CASCADE, related_name='blocks', verbose_name='الصفحة')
    block_type = models.CharField('نوع البلوك', max_length=30, choices=BlockType.choices)

    # Content
    translations = models.JSONField('الترجمات', default=dict, blank=True)

    content = models.JSONField('المحتوى', default=dict, blank=True)
    # مثال لـ hero: {"heading_en": "...", "heading_ar": "...", "cta_text_en": "...", "show_particles": true}

    styles = models.JSONField('الأنماط', default=dict, blank=True)
    # مثال: {"background": "...", "padding": "5rem 2rem", "text_color": "#FFF"}

    layout = models.JSONField('التخطيط', default=dict, blank=True)
    # مثال: {"columns": 3, "gap": "2rem", "max_width": "1200px"}

    # Animation
    animation = models.JSONField('الأنيميشن', default=dict, blank=True)
    # مثال: {"type": "fadeInUp", "delay": 0, "duration": 0.6}

    # Status
    is_active = models.BooleanField('نشط', default=True)
    order = models.IntegerField('الترتيب', default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order']
        verbose_name = 'بلوك'
        verbose_name_plural = 'البلوكات'

    def __str__(self):
        return f"{self.page} — {self.get_block_type_display()}"


class MenuItem(models.Model):
    """عنصر في قائمة التنقل"""

    class MenuPosition(models.TextChoices):
        HEADER = 'header', 'القائمة العلوية'
        FOOTER = 'footer', 'تذييل الصفحة'
        SIDEBAR = 'sidebar', 'الشريط الجانبي'

    menu = models.CharField('القائمة', max_length=20, choices=MenuPosition.choices, default=MenuPosition.HEADER)

    class ServiceContext(models.TextChoices):
        ACADEMY = 'academy', 'الأكاديمية'
        SCHOOL = 'school', 'آفاق مدرستي'
        CURRICULUM = 'curriculum', 'المناهج'
        LESSON_PLANS = 'lesson-plans', 'خطط الدروس'
        EBOOKS = 'ebooks', 'الكتب الإلكترونية'
        DASHBOARD = 'dashboard', 'ساحة العمل'
        PROFILE = 'profile', 'الملف الشخصي'
        GAMIFICATION = 'gamification', 'التلعيب'
        SUBSCRIPTIONS = 'subscriptions', 'الاشتراكات'
        ADMIN = 'admin', 'لوحة الإدارة'

    class RequiredRole(models.TextChoices):
        USER = 'user', 'مستخدم عام'
        INSTRUCTOR = 'instructor', 'مدرب'
        ADMIN = 'admin', 'مدير'
        SUPPORT = 'support', 'دعم'
        FINANCE = 'finance', 'مالية'
        DEVELOPER = 'developer', 'مطور'
        SCHOOL_ADMIN = 'school_admin', 'مدير مدرسة'
        TEACHER = 'teacher', 'معلم'
        PARENT = 'parent', 'ولي أمر'
        STUDENT = 'student', 'طالب'
        SCHOOL_ACCOUNTANT = 'school_accountant', 'محاسب مدرسي'
        SCHOOL_TRANSPORT_OFFICER = 'school_transport_officer', 'مسؤول نقل'
        SCHOOL_LIBRARIAN = 'school_librarian', 'أمين مكتبة'

    service_context = ArrayField(
        models.CharField('السياق', max_length=30, choices=ServiceContext.choices),
        verbose_name='سياقات الخدمة',
        default=list,
        blank=True,
        help_text='القائمة الفارغة = يظهر في كل الصفحات',
    )
    required_role = ArrayField(
        models.CharField('الدور', max_length=40, choices=RequiredRole.choices),
        verbose_name='الأدوار المطلوبة',
        default=list,
        blank=True,
        help_text='القائمة الفارغة = للجميع',
    )

    translations = models.JSONField('الترجمات', default=dict, blank=True)

    url = models.CharField('الرابط', max_length=500, blank=True, default='')
    page = models.ForeignKey(Page, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='menu_items', verbose_name='الصفحة المرتبطة')

    icon = models.CharField('الأيقونة', max_length=10, blank=True, default='')

    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True,
                                related_name='children', verbose_name='العنصر الأب')

    order = models.IntegerField('الترتيب', default=0)
    is_active = models.BooleanField('نشط', default=True)
    open_in_new = models.BooleanField('فتح في نافذة جديدة', default=False)

    # Styling
    css_class = models.CharField('كلاس CSS', max_length=200, blank=True, default='')
    badge = models.CharField('شارة', max_length=50, blank=True, default='')
    # مثال: "جديد", "مميز"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['menu', 'order']
        verbose_name = 'عنصر قائمة'
        verbose_name_plural = 'عناصر القوائم'

    def __str__(self):
        return f"{self.get_menu_display()} — {self.translations.get('ar', {}).get('title', '')}"

    @property
    def resolved_url(self):
        """إرجاع الرابط النهائي — الصفحة المرتبطة أو الرابط المخصص"""
        if self.page:
            return f"/{self.page.slug}"
        return self.url or '#'


class PageTemplate(models.Model):
    """قالب صفحة جاهز"""

    class Category(models.TextChoices):
        LANDING = 'landing', 'صفحة هبوط'
        BUSINESS = 'business', 'صفحة أعمال'
        EDUCATION = 'education', 'صفحة تعليمية'
        PORTFOLIO = 'portfolio', 'معرض أعمال'
        CUSTOM = 'custom', 'مخصص'

    slug = models.SlugField('الرابط', unique=True, max_length=100)

    translations = models.JSONField('الترجمات', default=dict, blank=True)

    thumbnail = models.URLField('صورة مصغرة', blank=True, default='')

    category = models.CharField('التصنيف', max_length=20, choices=Category.choices, default=Category.CUSTOM)

    # Default blocks for this template
    default_blocks = models.JSONField('البلوكات الافتراضية', default=list, blank=True)
    # مثال: [{"block_type": "hero", "content": {...}}, {"block_type": "features", "content": {...}}]

    # Default page settings
    default_layout = models.JSONField('التخطيط الافتراضي', default=dict, blank=True)

    is_active = models.BooleanField('نشط', default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'slug']
        verbose_name = 'قالب صفحة'
        verbose_name_plural = 'قوالب الصفحات'

    def __str__(self):
        return f"{self.translations.get('ar', {}).get('name', self.slug)} ({self.get_category_display()})"


class SiteSettings(models.Model):
    """إعدادات الموقع العامة"""

    # Basic info
    site_description_en = models.TextField('وصف الموقع (إنجليزي)', blank=True, default='')
    site_description_ar = models.TextField('وصف الموقع (عربي)', blank=True, default='')
    translations = models.JSONField('الترجمات', default=dict, blank=True)

    # Logo
    logo_url = models.URLField('شعار الموقع', blank=True, default='')
    favicon_url = models.URLField('Favicon', blank=True, default='')

    # Contact
    email = models.EmailField('البريد الإلكتروني', blank=True, default='')
    phone = models.CharField('الهاتف', max_length=50, blank=True, default='')
    whatsapp = models.CharField('واتساب', max_length=50, blank=True, default='')
    address = models.CharField('العنوان', max_length=300, blank=True, default='')

    # Social media
    facebook_url = models.URLField('فيسبوك', blank=True, default='')
    twitter_url = models.URLField('تويتر', blank=True, default='')
    instagram_url = models.URLField('إنستقرام', blank=True, default='')
    linkedin_url = models.URLField('لينكدإن', blank=True, default='')
    youtube_url = models.URLField('يوتيوب', blank=True, default='')

    # Footer
    copyright_text = models.CharField('نصحقوق النشر', max_length=200, blank=True, default='')
    footer_translations = models.JSONField('ترجمات التذييل', default=dict, blank=True)

    # Custom settings
    custom_settings = models.JSONField('إعدادات مخصصة', default=dict, blank=True)

    # Singleton
    is_active = models.BooleanField('نشط', default=True, primary_key=True)

    class Meta:
        verbose_name = 'إعدادات الموقع'
        verbose_name_plural = 'إعدادات الموقع'

    def __str__(self):
        return f"SiteSettings — {self.translations.get('ar', {}).get('site_name', '')}"

    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ContactMessage(models.Model):
    """رسالة تواصل معنا"""

    class Status(models.TextChoices):
        NEW = 'new', 'جديدة'
        READ = 'read', 'مقروءة'
        REPLIED = 'replied', 'تم الرد'
        ARCHIVED = 'archived', 'مؤرشفة'

    name = models.CharField('الاسم', max_length=200)
    email = models.EmailField('البريد الإلكتروني')
    phone = models.CharField('الهاتف', max_length=50, blank=True, default='')
    subject = models.CharField('الموضوع', max_length=300, blank=True, default='')
    message = models.TextField('الرسالة')

    service_interest = models.CharField('الخدمة المهتم بها', max_length=100, blank=True, default='')

    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.NEW)

    ip_address = models.GenericIPAddressField('عنوان IP', null=True, blank=True)
    user_agent = models.CharField('متصفح المستخدم', max_length=500, blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'رسالة تواصل'
        verbose_name_plural = 'رسائل التواصل'

    def __str__(self):
        return f"{self.name} — {self.subject or self.message[:50]}"


class NewsletterSubscriber(models.Model):
    """مشترك في النشرة البريدية"""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'نشط'
        UNSUBSCRIBED = 'unsubscribed', 'ملغي'

    email = models.EmailField('البريد الإلكتروني', unique=True)
    name = models.CharField('الاسم', max_length=200, blank=True, default='')
    locale = models.CharField('اللغة', max_length=10, default='ar')
    status = models.CharField('الحالة', max_length=20, choices=Status.choices, default=Status.ACTIVE)
    ip_address = models.GenericIPAddressField('عنوان IP', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'مشترك في النشرة'
        verbose_name_plural = 'مشتركو النشرة'

    def __str__(self):
        return self.email

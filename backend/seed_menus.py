import os

import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.base'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.pages.models import MenuItem

ALL_CONTEXTS = ['academy', 'school', 'curriculum', 'lesson-plans', 'ebooks',
                'dashboard', 'profile', 'gamification', 'subscriptions', 'admin']
ALL_ROLES = ['user', 'instructor', 'admin', 'support', 'finance', 'developer']


menu_items = [
    {"menu": "header", "translations": {"en": {"title": "Home"}, "ar": {"title": "الرئيسية"}}, "url": "/", "icon": "🏠", "order": 0, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Academy"}, "ar": {"title": "الأكاديمية"}}, "url": "/academy", "icon": "🎓", "order": 1, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Curriculum"}, "ar": {"title": "المناهج"}}, "url": "/curriculum", "icon": "📚", "order": 2, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "Blog"}, "ar": {"title": "المدونة"}}, "url": "/blog", "icon": "📝", "order": 3, "is_active": True},
    {"menu": "header", "translations": {"en": {"title": "E-Books"}, "ar": {"title": "الكتب الإلكترونية"}}, "url": "/ebooks", "icon": "📚", "order": 3, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "About Us"}, "ar": {"title": "من نحن"}}, "url": "/about", "icon": "ℹ️", "order": 0, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Privacy Policy"}, "ar": {"title": "سياسة الخصوصية"}}, "url": "/privacy", "icon": "🔒", "order": 1, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Terms of Service"}, "ar": {"title": "شروط الخدمة"}}, "url": "/terms", "icon": "📄", "order": 2, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "Contact Us"}, "ar": {"title": "تواصل معنا"}, "fr": {"title": "Contactez-nous"}, "tr": {"title": "Bize Ulaşın"}, "ur": {"title": "ہم سے رابطہ کریں"}, "es": {"title": "Contáctenos"}, "de": {"title": "Kontaktieren Sie uns"}, "id": {"title": "Hubungi Kami"}, "bn": {"title": "যোগাযোগ করুন"}}, "url": "/contact", "icon": "📞", "order": 3, "is_active": True},
    {"menu": "footer", "translations": {"en": {"title": "E-Books"}, "ar": {"title": "الكتب الإلكترونية"}}, "url": "/ebooks", "icon": "📚", "order": 4, "is_active": True},
]

sidebar_items = [
    # عام — يظهر في كل الخدمات
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Workspace"}, "ar": {"title": "ساحة العمل"}}, "url": "/dashboard", "icon": "📊", "order": 0, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Afaq Madrasti"}, "ar": {"title": "آفاق مدرستي"}}, "url": "/school", "icon": "🏫", "order": 1, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Academy"}, "ar": {"title": "الأكاديمية"}}, "url": "/academy", "icon": "🎬", "order": 2, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Curriculum"}, "ar": {"title": "المناهج الدراسية"}}, "url": "/curriculum", "icon": "📚", "order": 3, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "E-Books"}, "ar": {"title": "الكتب الإلكترونية"}}, "url": "/ebooks", "icon": "📖", "order": 4, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Gamification"}, "ar": {"title": "التلعيب والشارات"}}, "url": "/gamification", "icon": "🎮", "order": 5, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Subscriptions"}, "ar": {"title": "الاشتراكات"}}, "url": "/subscriptions", "icon": "💳", "order": 6, "is_active": True},
    {"menu": "sidebar", "service_context": ALL_CONTEXTS, "translations": {"en": {"title": "Profile"}, "ar": {"title": "الملف الشخصي"}}, "url": "/profile", "icon": "👤", "order": 7, "is_active": True},
    # الأكاديمية — يظهر في قسم الأكاديمية فقط
    {"menu": "sidebar", "service_context": ["academy"], "translations": {"en": {"title": "Academy Home"}, "ar": {"title": "رئيسية الأكاديمية"}}, "url": "/academy", "icon": "🎬", "order": 0, "is_active": True},
    {"menu": "sidebar", "service_context": ["academy"], "translations": {"en": {"title": "All Courses"}, "ar": {"title": "جميع الدورات"}}, "url": "/academy/courses", "icon": "📚", "order": 1, "is_active": True},
    {"menu": "sidebar", "service_context": ["academy"], "translations": {"en": {"title": "Workspace"}, "ar": {"title": "لوحة التحكم"}}, "url": "/dashboard", "icon": "📊", "order": 2, "is_active": True},
    # الكتب الإلكترونية
    {"menu": "sidebar", "service_context": ["ebooks"], "translations": {"en": {"title": "E-Books Library"}, "ar": {"title": "مكتبة الكتب"}}, "url": "/ebooks", "icon": "📖", "order": 0, "is_active": True},
    {"menu": "sidebar", "service_context": ["ebooks"], "translations": {"en": {"title": "Subscriptions"}, "ar": {"title": "الباقات"}}, "url": "/subscriptions", "icon": "💳", "order": 1, "is_active": True},
    {"menu": "sidebar", "service_context": ["ebooks"], "translations": {"en": {"title": "Workspace"}, "ar": {"title": "لوحة التحكم"}}, "url": "/dashboard", "icon": "📊", "order": 2, "is_active": True},
    # آفاق مدرستي — مساحات العمل حسب الأدوار والصلاحيات
    # مساحة عمل مدير المدرسة
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Dashboard"}, "ar": {"title": "لوحة المؤشرات"}}, "url": "/school/admin", "icon": "📊", "order": 10, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Sections & Students"}, "ar": {"title": "الشعب والطلاب"}}, "url": "/school/admin/sections", "icon": "🏫", "order": 11, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Timetables"}, "ar": {"title": "الجداول والبرامج"}}, "url": "/school/admin/timetable", "icon": "📅", "order": 12, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Attendance"}, "ar": {"title": "الحضور والغياب"}}, "url": "/school/admin/attendance", "icon": "🚨", "order": 13, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Announcements"}, "ar": {"title": "الإعلانات والطوارئ"}}, "url": "/school/admin/announcements", "icon": "📢", "order": 14, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["school_admin"], "translations": {"en": {"title": "Tickets & Files"}, "ar": {"title": "التذاكر والمرفقات"}}, "url": "/school/admin/tickets", "icon": "💬", "order": 15, "is_active": True},
    # مساحة عمل المعلم
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["teacher"], "translations": {"en": {"title": "Teacher Dashboard"}, "ar": {"title": "لوحة المعلم"}}, "url": "/teacher", "icon": "👨‍🏫", "order": 20, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["teacher"], "translations": {"en": {"title": "My Timetable"}, "ar": {"title": "جدول الحصص"}}, "url": "/teacher/timetable", "icon": "📅", "order": 21, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["teacher"], "translations": {"en": {"title": "Attendance"}, "ar": {"title": "تسجيل الحضور"}}, "url": "/teacher/attendance", "icon": "🚨", "order": 22, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["teacher"], "translations": {"en": {"title": "Parent Tickets"}, "ar": {"title": "تذاكر أولياء الأمور"}}, "url": "/teacher/tickets", "icon": "💬", "order": 23, "is_active": True},
    # بوابة ولي الأمر
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["parent"], "translations": {"en": {"title": "Parent Dashboard"}, "ar": {"title": "لوحة ولي الأمر"}}, "url": "/parent", "icon": "👨‍👩‍👧‍👦", "order": 30, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["parent"], "translations": {"en": {"title": "Children"}, "ar": {"title": "الأبناء"}}, "url": "/parent/children", "icon": "👨‍👩‍👧‍👦", "order": 31, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["parent"], "translations": {"en": {"title": "Attendance"}, "ar": {"title": "الحضور والغياب"}}, "url": "/parent/attendance", "icon": "📊", "order": 32, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["parent"], "translations": {"en": {"title": "Weekly Reports"}, "ar": {"title": "التقارير الأسبوعية"}}, "url": "/parent/reports", "icon": "📄", "order": 33, "is_active": True},
    # مساحة الطالب
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["student"], "translations": {"en": {"title": "Student Dashboard"}, "ar": {"title": "لوحة الطالب"}}, "url": "/student", "icon": "🎓", "order": 40, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["student"], "translations": {"en": {"title": "My Timetable"}, "ar": {"title": "جدول الحصص"}}, "url": "/student/timetable", "icon": "📅", "order": 41, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["student"], "translations": {"en": {"title": "Attendance"}, "ar": {"title": "سجل الحضور"}}, "url": "/student/attendance", "icon": "📊", "order": 42, "is_active": True},
    {"menu": "sidebar", "service_context": ["school"], "required_role": ["student"], "translations": {"en": {"title": "My Record"}, "ar": {"title": "السجل الشخصي"}}, "url": "/student/record", "icon": "🎓", "order": 43, "is_active": True},
    # المناهج وخطط الدروس
    {"menu": "sidebar", "service_context": ["curriculum"], "translations": {"en": {"title": "Curriculum"}, "ar": {"title": "المناهج الدراسية"}}, "url": "/curriculum", "icon": "📚", "order": 0, "is_active": True},
    {"menu": "sidebar", "service_context": ["curriculum"], "translations": {"en": {"title": "Lesson Plans"}, "ar": {"title": "خطط الدروس"}}, "url": "/lesson-plans", "icon": "📝", "order": 1, "is_active": True},
    {"menu": "sidebar", "service_context": ["curriculum"], "translations": {"en": {"title": "Workspace"}, "ar": {"title": "لوحة التحكم"}}, "url": "/dashboard", "icon": "📊", "order": 2, "is_active": True},
]

created = 0
for item in menu_items + sidebar_items:
    lookup = {"menu": item["menu"], "url": item["url"]}
    if item.get("service_context"):
        lookup["service_context"] = item["service_context"]
    obj, is_new = MenuItem.objects.get_or_create(
        **lookup,
        defaults=item
    )
    if is_new:
        created += 1
        print(f"  Created: {obj.translations.get('ar', {}).get('title', '')} / {obj.translations.get('en', {}).get('title', '')} ({obj.menu}/{obj.service_context})")
    else:
        print(f"  Exists: {obj.translations.get('ar', {}).get('title', '')} / {obj.translations.get('en', {}).get('title', '')} ({obj.menu}/{obj.service_context})")

print(f"\nTotal: {MenuItem.objects.count()} menu items ({created} new)")

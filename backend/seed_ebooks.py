import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.ebooks.models import Ebook, EbookCategory

CATEGORIES = [
    {"slug": "education", "translations": {"en": {"name": "Education"}, "ar": {"name": "تعليم"}}, "icon": "🎓", "order": 0},
    {"slug": "technology", "translations": {"en": {"name": "Technology"}, "ar": {"name": "تكنولوجيا"}}, "icon": "💻", "order": 1},
    {"slug": "business", "translations": {"en": {"name": "Business"}, "ar": {"name": "أعمال"}}, "icon": "📊", "order": 2},
    {"slug": "design", "translations": {"en": {"name": "Design"}, "ar": {"name": "تصميم"}}, "icon": "🎨", "order": 3},
]

EBOOKS = [
    {
        "slug": "ai-in-education",
        "translations": {
            "en": {"title": "AI in Education", "description": "A comprehensive guide to using artificial intelligence in modern education"},
            "ar": {"title": "الذكاء الاصطناعي في التعليم", "description": "دليل شامل لاستخدام الذكاء الاصطناعي في التعليم الحديث"}
        },
        "category_slug": "education",
        "pages_count": 120,
        "file_size": "5.2 MB",
        "is_published": True,
        "is_featured": True,
        "access_level": "free",
        "tags": "AI,education,guide",
    },
    {
        "slug": "web-design-fundamentals",
        "translations": {
            "en": {"title": "Web Design Fundamentals", "description": "Learn the basics of modern web design from scratch"},
            "ar": {"title": "أساسيات تصميم المواقع", "description": "تعلم أساسيات تصميم المواقع الحديثة من الصفر"}
        },
        "category_slug": "design",
        "pages_count": 85,
        "file_size": "3.8 MB",
        "is_published": True,
        "is_featured": True,
        "access_level": "free",
        "tags": "web,design,beginner",
    },
    {
        "slug": "digital-marketing-strategies",
        "translations": {
            "en": {"title": "Digital Marketing Strategies", "description": "Effective strategies for growing your business online"},
            "ar": {"title": "استراتيجيات التسويق الرقمي", "description": "استراتيجيات فعّالة لتنمية أعمالك عبر الإنترنت"}
        },
        "category_slug": "business",
        "pages_count": 95,
        "file_size": "4.1 MB",
        "is_published": True,
        "is_featured": False,
        "access_level": "basic",
        "tags": "marketing,business,strategy",
    },
    {
        "slug": "python-for-beginners",
        "translations": {
            "en": {"title": "Python for Beginners", "description": "Start your programming journey with Python"},
            "ar": {"title": "بايثون للمبتدئين", "description": "ابدأ رحلتك في البرمجة مع بايثون"}
        },
        "category_slug": "technology",
        "pages_count": 150,
        "file_size": "6.7 MB",
        "is_published": True,
        "is_featured": True,
        "access_level": "pro",
        "tags": "python,programming,beginner",
    },
    {
        "slug": "effective-teaching-methods",
        "translations": {
            "en": {"title": "Effective Teaching Methods", "description": "Modern teaching techniques for better student outcomes"},
            "ar": {"title": "طرق التدريس الفعّالة", "description": "تقنيات تدريس حديثة لنتائج أفضل للطلاب"}
        },
        "category_slug": "education",
        "pages_count": 110,
        "file_size": "4.5 MB",
        "is_published": True,
        "is_featured": False,
        "access_level": "enterprise",
        "tags": "teaching,methods,education",
    },
]

cats = {}
for cat_data in CATEGORIES:
    cat, _ = EbookCategory.objects.get_or_create(slug=cat_data["slug"], defaults=cat_data)
    cats[cat_data["slug"]] = cat
    print(f"  Category: {cat.slug}")

for ebook_data in EBOOKS:
    cat_slug = ebook_data.pop("category_slug")
    ebook, created = Ebook.objects.get_or_create(
        slug=ebook_data["slug"],
        defaults={**ebook_data, "category": cats[cat_slug]}
    )
    status = "Created" if created else "Exists"
    print(f"  {status}: {ebook.slug}")

print(f"\nDone! {EbookCategory.objects.count()} categories, {Ebook.objects.count()} ebooks")

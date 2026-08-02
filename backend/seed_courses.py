"""
Seed courses with real free YouTube courses.
Sources (all legally free on YouTube):
- Elzero Web School (أسامة الزيرو) — HTML, CSS, JavaScript (Arabic)
- Codezilla (كودزيلا) — Python (Arabic)
- freeCodeCamp.org — React, Next.js, Python (English)

Run: python seed_courses.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.courses.models import Chapter, Course, CourseCategory, Lesson
from course_data import CSS_LESSONS, HTML_LESSONS, JS_LESSONS, PY_LESSONS

# ════════════════════════════════════════════════════════════════
# Categories
# ════════════════════════════════════════════════════════════════

CATEGORIES = [
    {
        "slug": "web-development", "icon": "🌐", "order": 0,
        "translations": {
            "ar": {"name": "تطوير الويب", "description": "HTML, CSS, JavaScript وأكثر"},
            "en": {"name": "Web Development", "description": "HTML, CSS, JavaScript and more"},
        },
    },
    {
        "slug": "programming", "icon": "💻", "order": 1,
        "translations": {
            "ar": {"name": "البرمجة", "description": "لغات البرمجة من الصفر"},
            "en": {"name": "Programming", "description": "Programming languages from scratch"},
        },
    },
    {
        "slug": "frontend-frameworks", "icon": "⚛️", "order": 2,
        "translations": {
            "ar": {"name": "أطر العمل", "description": "React, Next.js وأطر العمل الحديثة"},
            "en": {"name": "Frameworks", "description": "React, Next.js and modern frameworks"},
        },
    },
]


# ════════════════════════════════════════════════════════════════
# Helper: split lessons into chapters of N
# ════════════════════════════════════════════════════════════════

def make_chapters(lessons, chapter_titles_ar, chapter_titles_en, per_chapter=6):
    """Split a flat lesson list into chapters."""
    chapters = []
    for i, (ar_title, en_title) in enumerate(zip(chapter_titles_ar, chapter_titles_en, strict=False)):
        chunk = lessons[i * per_chapter:(i + 1) * per_chapter]
        if chunk:
            chapters.append({
                "translations": {"ar": {"title": ar_title}, "en": {"title": en_title}},
                "lessons": chunk,
            })
    return chapters


YOUTUBE_EMBED = "https://www.youtube.com/embed/{vid}"
YOUTUBE_THUMB = "https://i.ytimg.com/vi/{vid}/hqdefault.jpg"

ELZERO = {
    "ar": {"name": "أسامة الزيرو (Elzero Web School)"},
    "en": {"name": "Osama Elzero (Elzero Web School)"},
}
ELZERO_URL = "https://www.youtube.com/@ElzeroWebSchool"

CODEZILLA = {
    "ar": {"name": "كودزيلا (Codezilla)"},
    "en": {"name": "Codezilla"},
}
CODEZILLA_URL = "https://www.youtube.com/@codezilla"

FREECODECAMP = {
    "ar": {"name": "freeCodeCamp.org"},
    "en": {"name": "freeCodeCamp.org"},
}
FCC_URL = "https://www.youtube.com/@freecodecamp"


# ════════════════════════════════════════════════════════════════
# Courses
# ════════════════════════════════════════════════════════════════

COURSES = [
    # ── 1. HTML — Elzero ──
    {
        "slug": "learn-html-arabic",
        "category": "web-development",
        "level": "beginner",
        "language": "ar",
        "is_featured": True,
        "translations": {
            "ar": {
                "title": "تعلم HTML من الصفر — أسامة الزيرو",
                "description": "دورة شاملة لتعلم لغة HTML بالعربية من الأستاذ أسامة الزيرو. تبدأ من الصفر وتغطي جميع عناصر اللغة بأمثلة عملية. دورة مجانية بالكامل من قناة Elzero Web School.",
            },
            "en": {
                "title": "Learn HTML from Scratch — Elzero (Arabic)",
                "description": "A comprehensive Arabic HTML course by Osama Elzero. Starts from zero and covers all language elements with practical examples. Completely free from Elzero Web School.",
            },
        },
        "instructor_translations": ELZERO,
        "instructor_url": ELZERO_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid=HTML_LESSONS[0][0]),
        "duration_hours": 5.0,
        "chapters": make_chapters(
            HTML_LESSONS,
            ["البداية والأساسيات", "العناصر الأساسية", "القوائم والجداول"],
            ["Getting Started", "Core Elements", "Lists & Tables"],
        ),
    },
    # ── 2. CSS — Elzero ──
    {
        "slug": "learn-css-arabic",
        "category": "web-development",
        "level": "beginner",
        "language": "ar",
        "is_featured": True,
        "translations": {
            "ar": {
                "title": "تعلم CSS من الصفر — أسامة الزيرو",
                "description": "دورة كاملة لتعلم لغة CSS بالعربية. تغطي التنسيقات، الخلفيات، الحواف، الـ Box Model وأكثر بأسلوب عملي مبسط. مجانية بالكامل من Elzero Web School.",
            },
            "en": {
                "title": "Learn CSS from Scratch — Elzero (Arabic)",
                "description": "A complete Arabic CSS course covering styling, backgrounds, borders, the Box Model and more with a simple practical approach. Free from Elzero Web School.",
            },
        },
        "instructor_translations": ELZERO,
        "instructor_url": ELZERO_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid=CSS_LESSONS[0][0]),
        "duration_hours": 6.0,
        "chapters": make_chapters(
            CSS_LESSONS,
            ["المقدمة والأساسيات", "الخلفيات والمسافات", "الحدود والعرض"],
            ["Introduction & Basics", "Backgrounds & Spacing", "Borders & Display"],
        ),
    },
    # ── 3. JavaScript — Elzero ──
    {
        "slug": "learn-javascript-arabic",
        "category": "web-development",
        "level": "intermediate",
        "language": "ar",
        "is_featured": True,
        "translations": {
            "ar": {
                "title": "تعلم JavaScript من الصفر — أسامة الزيرو",
                "description": "أشهر دورة جافاسكريبت بالعربية. من المقدمة وأدوات التطوير إلى أنواع البيانات والمتغيرات. البداية المثالية لطريقك في برمجة الويب. مجانية من Elzero Web School.",
            },
            "en": {
                "title": "Learn JavaScript from Scratch — Elzero (Arabic)",
                "description": "The most famous Arabic JavaScript course. From intro and dev tools to data types and variables. The perfect start for your web programming journey. Free from Elzero Web School.",
            },
        },
        "instructor_translations": ELZERO,
        "instructor_url": ELZERO_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid=JS_LESSONS[0][0]),
        "duration_hours": 7.0,
        "chapters": make_chapters(
            JS_LESSONS,
            ["البداية والأدوات", "أساسيات اللغة", "المتغيرات والبيانات"],
            ["Getting Started & Tools", "Language Basics", "Variables & Data"],
        ),
    },
    # ── 4. Python — Codezilla ──
    {
        "slug": "learn-python-arabic",
        "category": "programming",
        "level": "beginner",
        "language": "ar",
        "is_featured": True,
        "translations": {
            "ar": {
                "title": "تعلم بايثون بالعربي — كودزيلا",
                "description": "دورة بايثون عربية ممتعة من قناة كودزيلا. تبدأ من تثبيت بايثون وتكتب أول برنامج لك، مع تطبيقات عملية مثل بناء آلة حاسبة. مجانية بالكامل.",
            },
            "en": {
                "title": "Learn Python in Arabic — Codezilla",
                "description": "A fun Arabic Python course by Codezilla. Starts from installing Python to writing your first program, with practical apps like building a calculator. Completely free.",
            },
        },
        "instructor_translations": CODEZILLA,
        "instructor_url": CODEZILLA_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid=PY_LESSONS[0][0]),
        "duration_hours": 4.5,
        "chapters": make_chapters(
            PY_LESSONS,
            ["الإعداد والبداية", "الأساسيات", "تطبيقات عملية"],
            ["Setup & Start", "The Basics", "Practical Apps"],
        ),
    },
    # ── 5. React — freeCodeCamp (English) ──
    {
        "slug": "learn-react-full-course",
        "category": "frontend-frameworks",
        "level": "intermediate",
        "language": "en",
        "is_featured": False,
        "translations": {
            "ar": {
                "title": "دورة React كاملة للمبتدئين — freeCodeCamp",
                "description": "الدورة الأشهر عالمياً لتعلم React من freeCodeCamp بالإنجليزية. دورة كاملة في فيديو واحد طويل تغطي المكونات والـ State والـ Props والمشاريع العملية.",
            },
            "en": {
                "title": "Learn React JS — Full Course for Beginners",
                "description": "The world-famous React course from freeCodeCamp. A complete course in one long video covering components, state, props, and hands-on projects.",
            },
        },
        "instructor_translations": FREECODECAMP,
        "instructor_url": FCC_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid="DLX62G4lc44"),
        "duration_hours": 5.5,
        "chapters": [
            {
                "translations": {"ar": {"title": "الدورة الكاملة"}, "en": {"title": "Full Course"}},
                "lessons": [
                    ("DLX62G4lc44", "Learn React JS - Full Course for Beginners - Tutorial 2019"),
                ],
            },
        ],
    },
    # ── 6. Next.js — freeCodeCamp (English) ──
    {
        "slug": "nextjs-for-beginners",
        "category": "frontend-frameworks",
        "level": "advanced",
        "language": "en",
        "is_featured": False,
        "translations": {
            "ar": {
                "title": "Next.js للمبتدئين — دورة كاملة — freeCodeCamp",
                "description": "تعلم إطار عمل Next.js الحديث لبناء تطبيقات React احترافية مع التوجيه والتصيير من الخادم. دورة مجانية كاملة من freeCodeCamp بالإنجليزية.",
            },
            "en": {
                "title": "Next.js for Beginners — Full Course",
                "description": "Learn the modern Next.js framework for building professional React apps with routing and server-side rendering. A full free course from freeCodeCamp.",
            },
        },
        "instructor_translations": FREECODECAMP,
        "instructor_url": FCC_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid="1WmNXEVia8I"),
        "duration_hours": 4.0,
        "chapters": [
            {
                "translations": {"ar": {"title": "الدورة الكاملة"}, "en": {"title": "Full Course"}},
                "lessons": [
                    ("1WmNXEVia8I", "Next.js for Beginners - Full Course"),
                ],
            },
        ],
    },
    # ── 7. Python — freeCodeCamp (English) ──
    {
        "slug": "learn-python-full-course-english",
        "category": "programming",
        "level": "beginner",
        "language": "en",
        "is_featured": False,
        "translations": {
            "ar": {
                "title": "تعلم Python — دورة كاملة للمبتدئين — freeCodeCamp",
                "description": "دورة بايثون الأشهر بالإنجليزية من freeCodeCamp. شرح كامل للمبتدئين يغطي أساسيات اللغة والتطبيقات العملية.",
            },
            "en": {
                "title": "Learn Python — Full Course for Beginners",
                "description": "The most famous English Python course from freeCodeCamp. A complete beginner tutorial covering language fundamentals and practical applications.",
            },
        },
        "instructor_translations": FREECODECAMP,
        "instructor_url": FCC_URL,
        "thumbnail": YOUTUBE_THUMB.format(vid="rfscVS0vtbw"),
        "duration_hours": 4.5,
        "chapters": [
            {
                "translations": {"ar": {"title": "الدورة الكاملة"}, "en": {"title": "Full Course"}},
                "lessons": [
                    ("rfscVS0vtbw", "Learn Python - Full Course for Beginners [Tutorial]"),
                ],
            },
        ],
    },
]


# ════════════════════════════════════════════════════════════════
# Seed
# ════════════════════════════════════════════════════════════════

print("Seeding course categories...")
for cat_data in CATEGORIES:
    cat, created = CourseCategory.objects.update_or_create(
        slug=cat_data["slug"],
        defaults=cat_data,
    )
    print(f"  {'Created' if created else 'Updated'}: {cat}")

print("\nSeeding courses...")
for course_data in COURSES:
    chapters_data = course_data.pop("chapters")
    cat = CourseCategory.objects.filter(slug=course_data.pop("category")).first()

    course, created = Course.objects.update_or_create(
        slug=course_data["slug"],
        defaults={
            **course_data,
            "category": cat,
            "is_free": True,
            "price": 0,
            "is_published": True,
        },
    )

    # Clear old chapters/lessons for idempotent re-seeding
    course.chapters.all().delete()

    for ci, ch_data in enumerate(chapters_data):
        chapter = Chapter.objects.create(
            course=course,
            translations=ch_data["translations"],
            order=ci,
        )
        for li, (vid, title) in enumerate(ch_data["lessons"]):
            # Keep Arabic title as-is; extract English title if title is English
            Lesson.objects.create(
                chapter=chapter,
                video_url=YOUTUBE_EMBED.format(vid=vid),
                duration_minutes=15,
                order=li,
                is_free_preview=(ci == 0 and li < 2),  # first 2 lessons of first chapter are previews
                translations={
                    "ar": {"title": title},
                    "en": {"title": title},
                },
            )

    lessons_total = Lesson.objects.filter(chapter__course=course).count()
    print(f"  {'Created' if created else 'Updated'}: {course} ({lessons_total} lessons)")

print(f"\nDone! Categories: {CourseCategory.objects.count()}, Courses: {Course.objects.count()}, Chapters: {Chapter.objects.count()}, Lessons: {Lesson.objects.count()}")

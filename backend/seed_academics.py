"""
Seed script for academic grades, subjects, and curricula.
Run: python seed_academics.py
"""
import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.academics.models import Curriculum, Grade, Subject


def run():
    print("Seeding Academics...")

    # Grades
    grades_data = [
        {'level': 1, 'ar': {'name': 'المرحلة الابتدائية (الصف 1-6)'}, 'en': {'name': 'Primary School (Grades 1-6)'}},
        {'level': 2, 'ar': {'name': 'المرحلة الإعدادية (الصف 7-9)'}, 'en': {'name': 'Middle School (Grades 7-9)'}},
        {'level': 3, 'ar': {'name': 'المرحلة الثانوية (الصف 10-12)'}, 'en': {'name': 'High School (Grades 10-12)'}},
    ]

    grade_objs = []
    for g in grades_data:
        grade, _ = Grade.objects.get_or_create(
            level=g['level'],
            defaults={'translations': {'ar': g['ar'], 'en': g['en']}}
        )
        grade_objs.append(grade)

    # Subjects
    subjects_data = [
        {'icon': '🔢', 'ar': {'name': 'الرياضيات'}, 'en': {'name': 'Mathematics'}},
        {'icon': '🔬', 'ar': {'name': 'العلوم'}, 'en': {'name': 'Science'}},
        {'icon': '📖', 'ar': {'name': 'اللغة العربية'}, 'en': {'name': 'Arabic Language'}},
        {'icon': '🌐', 'ar': {'name': 'اللغة الإنجليزية'}, 'en': {'name': 'English Language'}},
        {'icon': '⚛️', 'ar': {'name': 'الفيزياء'}, 'en': {'name': 'Physics'}},
        {'icon': '🧪', 'ar': {'name': 'الكيمياء'}, 'en': {'name': 'Chemistry'}},
        {'icon': '📜', 'ar': {'name': 'التاريخ'}, 'en': {'name': 'History'}},
        {'icon': '🌍', 'ar': {'name': 'الجغرافيا'}, 'en': {'name': 'Geography'}},
    ]

    for s in subjects_data:
        Subject.objects.get_or_create(
            icon=s['icon'],
            defaults={'translations': {'ar': s['ar'], 'en': s['en']}}
        )

    # Curricula
    if grade_objs:
        Curriculum.objects.get_or_create(
            country='المملكة الأردنية الهاشمية',
            year=2026,
            grade=grade_objs[0],
            defaults={'translations': {'ar': {'name': 'المنهاج الوطني الموحد'}, 'en': {'name': 'National Curriculum'}}}
        )

    print("Academics seeded successfully!")

if __name__ == '__main__':
    run()

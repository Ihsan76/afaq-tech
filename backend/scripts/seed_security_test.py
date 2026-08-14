"""
Security/QA seed script — builds a fully isolated test dataset.

Run (from backend/, with the security venv active):
  DJANGO_SETTINGS_MODULE=config.settings.security_test SECURITY_DB_PATH=/tmp/afaqsec/security.db python scripts/seed_security_test.py

Creates:
  - Users with every role (known passwords, documented below)
  - Landing pages + blocks (via seed_pages.py)
  - A school with grades, sections, students (fictional national IDs)
  - Subscriptions (active/expired) + paid content
  - 2 intentionally broken blocks (invalid HTML + broken link) to exercise visual/user-flow QA
"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.security_test')
os.environ.setdefault('SECURITY_DB_PATH', '/tmp/afaqsec/security.db')

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django

django.setup()

from django.db import transaction
from django.utils import timezone

from apps.users.models import User

# ────────────────────────────────────────────────────────────────
# Accounts (passwords below are for the isolated env ONLY)
# ────────────────────────────────────────────────────────────────
ACCOUNTS = [
    # (email, password, role, extra)
    ('admin.sec@afaq.app', 'AdminPass123!', 'admin', {'is_staff': True, 'is_superuser': True}),
    ('school_admin.sec@afaq.app', 'SchoolPass123!', 'school_admin', {}),
    ('teacher.sec@afaq.app', 'TeacherPass123!', 'teacher', {}),
    ('student.sec@afaq.app', 'StudentPass123!', 'student', {}),
    ('parent.sec@afaq.app', 'ParentPass123!', 'parent', {}),
    ('user.sec@afaq.app', 'UserPass123!', 'user', {}),
    ('creator.sec@afaq.app', 'CreatorPass123!', 'creator', {}),
    ('support.sec@afaq.app', 'SupportPass123!', 'support', {}),
]

PW_FILE = os.environ.get('SECURITY_PW_FILE', '/tmp/afaqsec/accounts.txt')


def seed_users():
    print('\n== Users ==')
    created = 0
    for email, password, role, extra in ACCOUNTS:
        user, was_created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'password': '',
                'role': role,
                'is_verified': True,
                'phone_verified': True,
                'is_active': True,
                **extra,
            },
        )
        if was_created:
            user.set_password(password)
            user.save(update_fields=['password'])
            created += 1
        print(f'  {"created" if was_created else "exists "}: {email} ({role})')

    admin = User.objects.get(email='admin.sec@afaq.app')
    admin.is_staff = True
    admin.is_superuser = True
    admin.save(update_fields=['is_staff', 'is_superuser'])

    with open(PW_FILE, 'w') as f:
        f.write('# Isolated security env accounts (test data ONLY, not production)\n')
        for email, password, role, _ in ACCOUNTS:
            f.write(f'{role:<14} {email:<28} {password}\n')
    print(f'  accounts written to {PW_FILE}')

    # A second regular user to test cross-user access (IDOR)
    second, _ = User.objects.get_or_create(
        email='second.sec@afaq.app',
        defaults={'username': 'second.sec@afaq.app', 'role': 'user', 'is_verified': True},
    )
    if _:
        second.set_password('SecondPass123!')
        second.save(update_fields=['password'])
    print(f'  {"created" if _ else "exists "}: second.sec@afaq.app (user, for IDOR tests)')
    return created


def seed_pages():
    print('\n== Pages ==')
    # Reuse the canonical seed — run it as a module so __main__ guard applies.
    import importlib

    seed = importlib.import_module('seed_pages')
    seed_page_data = getattr(seed, 'PAGES', None)
    from apps.pages.models import Page, PageBlock

    # Replicate seed logic so we can inject broken blocks afterwards.
    from apps.core.cache import invalidate_site_cache

    for page_data in seed_page_data:
        blocks_data = page_data.pop('blocks', [])
        page, was_created = Page.objects.update_or_create(
            slug=page_data['slug'],
            defaults=page_data,
        )
        page.blocks.all().delete()
        for i, b_data in enumerate(blocks_data):
            PageBlock.objects.create(page=page, **b_data)
        print(f'  {"created" if was_created else "updated"}: {page}')

    # 1) Broken HTML in homepage subtitle (renders oddly / scripts as text).
    hp = Page.objects.get(slug='homepage')
    hero = hp.blocks.filter(block_type='platform_hero').first()
    if hero:
        c = hero.content or {}
        c.setdefault('translations', {})['subtitle'] = {
            'ar': 'قبل أن تُغلق <b>وعلامة لم تغلق',  # intentional malformed tag
            'en': 'Opening <i>tags never closed',
        }
        hero.content = c
        hero.save(update_fields=['content'])

    # 2) Broken/missing link in a CTA (link checker target).
    sch = Page.objects.get(slug='school')
    shero = sch.blocks.filter(block_type='hero').first()
    if shero:
        c = shero.content or {}
        c.setdefault('translations', {})['cta_link'] = {'ar': '/nonexistent-target', 'en': '/nonexistent-target'}
        shero.content = c
        shero.save(update_fields=['content'])

    invalidate_site_cache()
    print(f'  total pages: {Page.objects.count()}, blocks: {PageBlock.objects.count()}')


def seed_school():
    print('\n== School ==')
    from apps.academics.models import Grade, Subject
    from apps.schools.models import (
        AcademicYear,
        School,
        SchoolGrade,
        SchoolTeacher,
        Section,
        StudentEnrollment,
        TeacherAssignment,
    )

    school_admin = User.objects.get(email='school_admin.sec@afaq.app')
    teacher = User.objects.get(email='teacher.sec@afaq.app')
    student = User.objects.get(email='student.sec@afaq.app')

    school, _ = School.objects.get_or_create(
        school_code='SEC-001',
        defaults={
            'name': 'مدرسة أمن الاختبار',
            'directorate': 'مديرية الاختبار',
            'governorate': 'عمّان',
            'region': 'وسط',
            'gender': 'mixed',
            'education_type': 'basic',
            'phone': '+962700000001',
            'address': 'شارع الاختبار 1',
            'manager': school_admin,
        },
    )
    print(f'  {"created" if _ else "exists "}: school {school.name}')

    year, _ = AcademicYear.objects.get_or_create(
        name='2025/2026',
        defaults={'start_date': timezone.now().date() - timezone.timedelta(days=90),
                  'end_date': timezone.now().date() + timezone.timedelta(days=275),
                  'is_current': True},
    )
    grade7, _ = Grade.objects.get_or_create(level=7, defaults={'translations': {'ar': 'الصف السابع', 'en': 'Grade 7'}})
    grade8, _ = Grade.objects.get_or_create(level=8, defaults={'translations': {'ar': 'الصف الثامن', 'en': 'Grade 8'}})
    sg7, _ = SchoolGrade.objects.get_or_create(school=school, grade=grade7, defaults={'section_count': 2, 'is_active': True})
    sg8, _ = SchoolGrade.objects.get_or_create(school=school, grade=grade8, defaults={'section_count': 1, 'is_active': True})

    sec7a, _ = Section.objects.get_or_create(
        school=school, grade=grade7, academic_year=year, name='7A',
        defaults={'capacity': 30, 'class_teacher': teacher},
    )
    sec8a, _ = Section.objects.get_or_create(
        school=school, grade=grade8, academic_year=year, name='8A',
        defaults={'capacity': 30, 'class_teacher': teacher},
    )

    SchoolTeacher.objects.get_or_create(school=school, teacher=teacher, defaults={'max_weekly_periods': 24})
    subject_math, _ = Subject.objects.get_or_create(
        translations={'ar': 'الرياضيات', 'en': 'Mathematics'}, defaults={'icon': '📐'},
    )
    TeacherAssignment.objects.get_or_create(section=sec7a, teacher=teacher, subject=subject_math, academic_year=year)
    TeacherAssignment.objects.get_or_create(section=sec8a, teacher=teacher, subject=subject_math, academic_year=year)

    # Fictional students with national IDs (10-digit) + their enrollments.
    students = [
        # email, national_id, name
        ('s1.sec@afaq.app', '1002003004', 'طالبة اختبار 1'),
        ('s2.sec@afaq.app', '1002003005', 'طالبة اختبار 2'),
        ('s3.sec@afaq.app', '1002003006', 'طالب اختبار 3'),
    ]
    for email, nid, name in students:
        u, created = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'role': 'student', 'is_verified': True,
                      'national_id': nid, 'first_name': name},
        )
        if created:
            u.set_password('StudentPass123!')
            u.save(update_fields=['password'])
        section = sec7a if email in ('s1.sec@afaq.app', 's2.sec@afaq.app') else sec8a
        StudentEnrollment.objects.get_or_create(student=u, section=section, academic_year=year)
        print(f'  {"created" if created else "exists "}: student {email} ({name}) in {section.name}')

    # The main "student" role account also enrolled (so dashboards render).
    StudentEnrollment.objects.get_or_create(student=student, section=sec7a, academic_year=year)
    print(f'  main student.sec@afaq.app enrolled in {sec7a.name}')


def seed_subscriptions():
    print('\n== Subscriptions ==')
    from apps.subscriptions.models import Plan, Subscription

    creator = User.objects.get(email='creator.sec@afaq.app')
    second = User.objects.get(email='second.sec@afaq.app')

    plan_pro, _ = Plan.objects.get_or_create(
        code='pro-sec',
        defaults={'name': 'Pro (security test)', 'description': 'test plan',
                  'price': 9.99, 'currency': 'USD', 'prices': {'USD': 9.99},
                  'billing_period': 'monthly', 'duration_days': 30, 'seats': 1,
                  'extra_seat_price': 0, 'level': 3, 'features': {'paid_content': True},
                  'is_active': True, 'is_featured': True},
    )

    # Active subscription for creator (paid content access).
    Subscription.objects.get_or_create(
        user=creator, plan=plan_pro,
        defaults={'status': 'active', 'payment_provider': 'stripe', 'payment_transaction_id': 'pi_test_sec_001',
                  'price_paid': 9.99, 'currency': 'USD', 'start_at': timezone.now(),
                  'end_at': timezone.now() + timezone.timedelta(days=30), 'paid_at': timezone.now()},
    )
    # Expired subscription for second user (should be blocked from paid content).
    Subscription.objects.get_or_create(
        user=second, plan=plan_pro,
        defaults={'status': 'expired', 'payment_provider': 'stripe', 'payment_transaction_id': 'pi_test_sec_002',
                  'price_paid': 9.99, 'currency': 'USD', 'start_at': timezone.now() - timezone.timedelta(days=60),
                  'end_at': timezone.now() - timezone.timedelta(days=30), 'paid_at': timezone.now() - timezone.timedelta(days=60)},
    )
    print(f'  active: creator.sec@afaq.app / expired: second.sec@afaq.app')


@transaction.atomic
def run():
    seed_users()
    seed_pages()
    seed_school()
    seed_subscriptions()
    print('\nSeed complete. Isolated env ready.')


if __name__ == '__main__':
    run()

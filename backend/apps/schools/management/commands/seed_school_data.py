"""توليد بيانات تجريبية للمدارس: سنة دراسية + شعب + طلاب + أولياء أمور لكل المدارس.

يستخدم الربط الدفعي على مستوى قاعدة البيانات (bulk_create + returning_fields)
بدلاً من إنشاء كل سجل على حدة، لضمان السرعة على آلاف المدارس.

الاستخدام:
  python manage.py seed_school_data                 # كل المدارس، 4 طلاب/شعبة، مع أولياء أمور
  python manage.py seed_school_data --students-per-section 3
  python manage.py seed_school_data --no-parents
  python manage.py seed_school_data --reset         # حذف البيانات المولّدة سابقاً ثم إعادة البناء
  python manage.py seed_school_data --dry-run       # إحصاء فقط دون كتابة
"""
import random
from datetime import date

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.academics.models import Grade
from apps.schools.models import AcademicYear, FamilyLink, Section, School, StudentEnrollment
from apps.users.models import User

ACADEMIC_YEAR_NAME = '2025/2026'
CHUNK_SIZE = 300

GRADES_BY_EDUCATION_TYPE = {
    'مرحلة رياض الاطفال': [0],
    'المرحلة الأساسية': list(range(1, 11)),
    'المرحلة الثانوية': list(range(11, 14)),
}

DEFAULT_GRADE_LEVELS = list(range(1, 11))

MALE_NAMES = [
    'أحمد', 'محمد', 'عمر', 'خالد', 'يوسف', 'علي', 'حسن', 'حسين', 'عبدالله', 'إبراهيم',
    'سامر', 'زياد', 'طارق', 'بلال', 'أنس', 'مصطفى', 'حمزة', 'ليث', 'قيس', 'نادر',
    'رامي', 'هاني', 'أيمن', 'فادي', 'مازن', 'وليد', 'غيث', 'يزن', 'آدم', 'فراس',
]

FEMALE_NAMES = [
    'فاطمة', 'آية', 'رهف', 'سارة', 'مريم', 'نور', 'لين', 'ريم', 'سلمى', 'هنا',
    'ملك', 'جنى', 'ياسمين', 'آلاء', 'دينا', 'هبة', 'رنا', 'شهد', 'تالا', 'رغد',
    'لانا', 'بتول', 'رزان', 'سجى', 'عنود', 'حلا', 'ليان', 'ريتاج', 'سما', 'علا',
]

SURNAMES = [
    'أبو رزق', 'العزام', 'الحديد', 'الشامخ', 'الخطيب', 'النجار', 'الصمادي', 'الزعبي',
    'عبيدات', 'بني عطية', 'الرواشدة', 'المومني', 'الجراح', 'القضاة', 'الحمايدة',
    'العجارمة', 'الهروط', 'الشياب', 'الذنيبات', 'بني حسن', 'النابلسي', 'العبداللات',
]


class Command(BaseCommand):
    help = 'Generate demo sections, students and parents for every school (bulk linked).'

    def add_arguments(self, parser):
        parser.add_argument('--students-per-section', type=int, default=4, help='عدد الطلاب في كل شعبة (الافتراضي 4)')
        parser.add_argument('--no-parents', action='store_true', help='عدم إنشاء حسابات أولياء الأمور')
        parser.add_argument('--reset', action='store_true', help='حذف البيانات المولّدة سابقاً قبل إعادة البناء')
        parser.add_argument('--dry-run', action='store_true', help='حساب الأعداد دون الكتابة في قاعدة البيانات')

    def handle(self, *args, **options):
        students_per_section = max(1, options['students_per_section'])
        with_parents = not options['no_parents']
        dry_run = options['dry_run']

        if options['reset'] and not dry_run:
            self._reset()

        year, created = AcademicYear.objects.get_or_create(
            name=ACADEMIC_YEAR_NAME,
            defaults={'is_current': True, 'start_date': date(2025, 9, 1), 'end_date': date(2026, 6, 30)},
        )
        if not year.is_current:
            AcademicYear.objects.update(is_current=False)
            year.is_current = True
            year.save(update_fields=['is_current'])

        grade_by_level = {g.level: g for g in Grade.objects.all()}
        required_levels = set(DEFAULT_GRADE_LEVELS)
        for levels in GRADES_BY_EDUCATION_TYPE.values():
            required_levels.update(levels)
        missing = [lvl for lvl in sorted(required_levels) if lvl not in grade_by_level]
        if missing:
            self.stderr.write(self.style.ERROR(f'Missing grade levels {missing} — run seed_curricula first.'))
            return

        schools = School.objects.all().order_by('id')
        total_schools = schools.count()
        existing = set(Section.objects.values_list('school_id', flat=True))

        stats = {
            'schools': 0,
            'existing_schools': len(existing),
            'sections': 0,
            'students': 0,
            'parents': 0,
            'enrollments': 0,
            'family_links': 0,
        }

        if options['reset'] and not dry_run:
            self._reset()
            starting_seq = 0
        else:
            starting_seq = self._max_existing_seq()

        student_seq = starting_seq
        chunk = []
        processed = 0

        for school in schools.iterator(chunk_size=500):
            processed += 1
            if school.id in existing:
                continue

            levels = self._levels_for(school)
            sec_count = len(levels)
            stu_count = sec_count * students_per_section
            stats['schools'] += 1
            stats['sections'] += sec_count
            stats['students'] += stu_count
            stats['enrollments'] += stu_count
            if with_parents:
                stats['parents'] += stu_count
                stats['family_links'] += stu_count

            if dry_run:
                continue

            chunk.append(school)
            if len(chunk) >= CHUNK_SIZE:
                student_seq = self._process_chunk(
                    chunk, year, grade_by_level, students_per_section, with_parents, student_seq,
                )
                chunk = []
                self.stdout.write(f'  ... {processed}/{total_schools} schools')

        if not dry_run and chunk:
            student_seq = self._process_chunk(
                chunk, year, grade_by_level, students_per_section, with_parents, student_seq,
            )
            self.stdout.write(f'  ... {total_schools}/{total_schools} schools')

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'Dry run: new schools={stats["schools"]} (existing skipped: {stats["existing_schools"]}) '
                f'sections={stats["sections"]} students={stats["students"]} parents={stats["parents"]}'
            ))
            return

        self.stdout.write(self.style.SUCCESS(
            f'Done: new schools={stats["schools"]} (existing skipped: {stats["existing_schools"]}) '
            f'sections={stats["sections"]} students={stats["students"]} '
            f'parents={stats["parents"]}'
        ))

    def _process_chunk(self, schools, year, grade_by_level, students_per_section, with_parents, student_seq):
        """Bulk-create sections, students, parents, enrollments and family links for a chunk of schools.

        يستخدم bulk_create ثم يعيد استرجاع المعرّفات عبر الحقول الفريدة (الربط)،
        لأن إصدار Django المثبّت لا يدعم returning_fields في bulk_create.
        """
        with transaction.atomic():
            school_ids = [s.id for s in schools]
            section_objs = [
                Section(school=school, grade=grade_by_level[level], academic_year=year, name='أ')
                for school in schools
                for level in self._levels_for(school)
            ]
            Section.objects.bulk_create(section_objs, batch_size=5000)
            section_map = {
                (row['school_id'], row['grade_id']): row['id']
                for row in Section.objects
                .filter(academic_year=year, school_id__in=school_ids)
                .values('id', 'school_id', 'grade_id')
            }

            users = []
            enrollment_refs = []
            link_refs = []

            for school in schools:
                for level in self._levels_for(school):
                    section_id = section_map[(school.id, grade_by_level[level].id)]
                    rng = random.Random(f'{school.school_code}-{level}-أ')
                    for _ in range(students_per_section):
                        student_seq += 1
                        first = rng.choice(self._gender_pool(school.gender, rng))
                        surname = rng.choice(SURNAMES)
                        student_email = f'student{student_seq:07d}@demo.afaq.edu.jo'
                        users.append(User(
                            username=student_email,
                            email=student_email,
                            password='',
                            role='student',
                            translations={'ar': {'name': f'{first} {surname}'}},
                            national_id=f'7{student_seq:09d}',
                            phone=f'07{student_seq % 100000000:08d}',
                            is_verified=True,
                            is_active=True,
                        ))
                        enrollment_refs.append((student_email, section_id))
                        if with_parents:
                            parent_email = f'parent{student_seq:07d}@demo.afaq.edu.jo'
                            users.append(User(
                                username=parent_email,
                                email=parent_email,
                                password='',
                                role='parent',
                                translations={'ar': {'name': f'{rng.choice(MALE_NAMES)} {surname}'}},
                                national_id=f'8{student_seq:09d}',
                                phone=f'07{(student_seq + 50000000) % 100000000:08d}',
                                is_verified=True,
                                is_active=True,
                            ))
                            link_refs.append((parent_email, student_email))

            User.objects.bulk_create(users, batch_size=5000)
            id_by_email = dict(
                User.objects.filter(email__in=[u.email for u in users]).values_list('email', 'id')
            )

            StudentEnrollment.objects.bulk_create(
                [StudentEnrollment(student_id=id_by_email[se], section_id=sid, academic_year=year)
                 for se, sid in enrollment_refs],
                batch_size=5000,
            )
            if link_refs:
                FamilyLink.objects.bulk_create(
                    [FamilyLink(parent_id=id_by_email[pe], student_id=id_by_email[se])
                     for pe, se in link_refs],
                    batch_size=5000,
                )

        return student_seq

    @staticmethod
    def _levels_for(school):
        edu_type = (school.education_type or '').strip()
        if edu_type == 'NULL':
            edu_type = ''
        return GRADES_BY_EDUCATION_TYPE.get(edu_type) or DEFAULT_GRADE_LEVELS

    @staticmethod
    def _gender_pool(gender, rng):
        gender = (gender or '').strip()
        if gender == 'ذكور':
            return MALE_NAMES
        if gender == 'اناث':
            return FEMALE_NAMES
        return MALE_NAMES if rng.random() < 0.5 else FEMALE_NAMES

    def _max_existing_seq(self):
        """أعلى رقم تسلسلي مستخدم في البريد الإلكتروني للمستخدمين التجريبيين، للاستئناف الآمن."""
        import re
        pattern = re.compile(r'^(?:student|parent)(\d{7})@demo\.afaq\.edu\.jo$')
        emails = User.objects.filter(email__endswith='@demo.afaq.edu.jo').values_list('email', flat=True)
        max_seq = 0
        for email in emails.iterator(chunk_size=20000):
            match = pattern.match(email)
            if match:
                max_seq = max(max_seq, int(match.group(1)))
        return max_seq

    def _reset(self):
        from django.db.models import Q
        demo_email = Q(email__endswith='@demo.afaq.edu.jo')
        FamilyLink.objects.filter(Q(parent__email__endswith='@demo.afaq.edu.jo') | Q(student__email__endswith='@demo.afaq.edu.jo')).delete()
        StudentEnrollment.objects.filter(student__email__endswith='@demo.afaq.edu.jo').delete()
        User.objects.filter(demo_email).delete()
        Section.objects.filter(academic_year__name=ACADEMIC_YEAR_NAME).delete()
        AcademicYear.objects.filter(name=ACADEMIC_YEAR_NAME).delete()
        self.stdout.write(self.style.WARNING('Reset done.'))

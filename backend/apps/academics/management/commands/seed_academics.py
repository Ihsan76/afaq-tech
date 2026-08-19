from django.core.management.base import BaseCommand

from apps.academics.models import AcademicTrack, Curriculum, Grade, Subject

GRADES = [
    {"level": 0, "ar": "تمهيدي", "en": "Kindergarten", "fr": "Maternelle", "tr": "Anaokulu", "ur": "کے جی", "es": "Preescolar", "de": "Vorschule", "id": "TK", "bn": "কেজি"},
    {"level": 1, "ar": "الأول الأساسي", "en": "Grade 1", "fr": "CP", "tr": "1. Sınıf", "ur": "پہلی جماعت", "es": "1er Grado", "de": "1. Klasse", "id": "Kelas 1", "bn": "প্রথম শ্রেণী"},
    {"level": 2, "ar": "الثاني الأساسي", "en": "Grade 2", "fr": "CE1", "tr": "2. Sınıf", "ur": "دوسری جماعت", "es": "2do Grado", "de": "2. Klasse", "id": "Kelas 2", "bn": "দ্বিতীয় শ্রেণী"},
    {"level": 3, "ar": "الثالث الأساسي", "en": "Grade 3", "fr": "CE2", "tr": "3. Sınıf", "ur": "تیسری جماعت", "es": "3er Grado", "de": "3. Klasse", "id": "Kelas 3", "bn": "তৃতীয় শ্রেণী"},
    {"level": 4, "ar": "الرابع الأساسي", "en": "Grade 4", "fr": "CM1", "tr": "4. Sınıf", "ur": "چوتھی جماعت", "es": "4to Grado", "de": "4. Klasse", "id": "Kelas 4", "bn": "চতুর্থ শ্রেণী"},
    {"level": 5, "ar": "الخامس الأساسي", "en": "Grade 5", "fr": "CM2", "tr": "5. Sınıf", "ur": "پانچویں جماعت", "es": "5to Grado", "de": "5. Klasse", "id": "Kelas 5", "bn": "পঞ্চম শ্রেণী"},
    {"level": 6, "ar": "السادس الأساسي", "en": "Grade 6", "fr": "6ème", "tr": "6. Sınıf", "ur": "چھٹی جماعت", "es": "6to Grado", "de": "6. Klasse", "id": "Kelas 6", "bn": "ষষ্ঠ শ্রেণী"},
    {"level": 7, "ar": "السابع الأساسي", "en": "Grade 7", "fr": "5ème", "tr": "7. Sınıf", "ur": "ساتویں جماعت", "es": "7mo Grado", "de": "7. Klasse", "id": "Kelas 7", "bn": "সপ্তম শ্রেণী"},
    {"level": 8, "ar": "الثامن الأساسي", "en": "Grade 8", "fr": "4ème", "tr": "8. Sınıf", "ur": "آٹھویں جماعت", "es": "8vo Grado", "de": "8. Klasse", "id": "Kelas 8", "bn": "অষ্টম শ্রেণী"},
    {"level": 9, "ar": "التاسع الأساسي", "en": "Grade 9", "fr": "3ème", "tr": "9. Sınıf", "ur": "نویں جماعت", "es": "9no Grado", "de": "9. Klasse", "id": "Kelas 9", "bn": "নবম শ্রেণী"},
    {"level": 10, "ar": "العاشر الأساسي", "en": "Grade 10", "fr": "2nde", "tr": "10. Sınıf", "ur": "دسویں جماعت", "es": "10mo Grado", "de": "10. Klasse", "id": "Kelas 10", "bn": "দশম শ্রেণী"},
    {"level": 11, "ar": "الأول الثانوي", "en": "Grade 11", "fr": "1ère", "tr": "11. Sınıf", "ur": "گیارہویں جماعت", "es": "11vo Grado", "de": "11. Klasse", "id": "Kelas 11", "bn": "একাদশ শ্রেণী"},
    {"level": 12, "ar": "الثاني الثانوي", "en": "Grade 12", "fr": "Terminale", "tr": "12. Sınıf", "ur": "بارہویں جماعت", "es": "12vo Grado", "de": "12. Klasse", "id": "Kelas 12", "bn": "দ্বাদশ শ্রেণী"},
    {"level": 13, "ar": "سنة أولى جامعة", "en": "University Year 1", "fr": "Licence 1", "tr": "Üniversite 1", "ur": "یونیورسٹی سال 1", "es": "Año 1 Universidad", "de": "Universität 1. Jahr", "id": "Universitas Tahun 1", "bn": "বিশ্ববিদ্যালয় ১ম বর্ষ"},
    {"level": 14, "ar": "سنة ثانية جامعة", "en": "University Year 2", "fr": "Licence 2", "tr": "Üniversite 2", "ur": "یونیورسٹی سال 2", "es": "Año 2 Universidad", "de": "Universität 2. Jahr", "id": "Universitas Tahun 2", "bn": "বিশ্ববিদ্যালয় ২য় বর্ষ"},
    {"level": 15, "ar": "سنة ثالثة جامعة", "en": "University Year 3", "fr": "Licence 3", "tr": "Üniversite 3", "ur": "یونیورسٹی سال 3", "es": "Año 3 Universidad", "de": "Universität 3. Jahr", "id": "Universitas Tahun 3", "bn": "বিশ্ববিদ্যালয় ৩য় বর্ষ"},
    {"level": 16, "ar": "سنة رابعة جامعة", "en": "University Year 4", "fr": "Master 1", "tr": "Üniversite 4", "ur": "یونیورسٹی سال 4", "es": "Año 4 Universidad", "de": "Universität 4. Jahr", "id": "Universitas Tahun 4", "bn": "বিশ্ববিদ্যালয় ৪র্থ বর্ষ"},
    {"level": 17, "ar": "سنة خامسة جامعة", "en": "University Year 5", "fr": "Master 2", "tr": "Üniversite 5", "ur": "یونیورسٹی سال 5", "es": "Año 5 Universidad", "de": "Universität 5. Jahr", "id": "Universitas Tahun 5", "bn": "বিশ্ববিদ্যালয় ৫ম বর্ষ"},
    {"level": 18, "ar": "سنة سادسة جامعة", "en": "University Year 6", "fr": "Doctorat 1", "tr": "Üniversite 6", "ur": "یونیورسٹی سال 6", "es": "Año 6 Universidad", "de": "Universität 6. Jahr", "id": "Universitas Tahun 6", "bn": "বিশ্ববিদ্যালয় ৬ষ্ঠ বর্ষ"},
]

SUBJECTS = [
    {"icon": "🔢", "ar": "الرياضيات", "en": "Mathematics", "fr": "Mathématiques", "tr": "Matematik", "ur": "ریاضی", "es": "Matemáticas", "de": "Mathematik", "id": "Matematika", "bn": "গণিত"},
    {"icon": "🔬", "ar": "العلوم", "en": "Science", "fr": "Sciences", "tr": "Fen Bilimleri", "ur": "سائنس", "es": "Ciencias", "de": "Naturwissenschaften", "id": "Ilmu Pengetahuan Alam", "bn": "বিজ্ঞান"},
    {"icon": "📖", "ar": "اللغة العربية", "en": "Arabic Language", "fr": "Langue Arabe", "tr": "Arapça Dili", "ur": "عربی زبان", "es": "Lengua Árabe", "de": "Arabische Sprache", "id": "Bahasa Arab", "bn": "আরবি ভাষা"},
    {"icon": "🌐", "ar": "اللغة الإنجليزية", "en": "English Language", "fr": "Langue Anglaise", "tr": "İngilizce Dili", "ur": "انگریزی زبان", "es": "Lengua Inglesa", "de": "Englische Sprache", "id": "Bahasa Inggris", "bn": "ইংরেজি ভাষা"},
    {"icon": "⚛️", "ar": "الفيزياء", "en": "Physics", "fr": "Physique", "tr": "Fizik", "ur": "طبیعیات", "es": "Física", "de": "Physik", "id": "Fisika", "bn": "পদার্থবিদ্যা"},
    {"icon": "🧪", "ar": "الكيمياء", "en": "Chemistry", "fr": "Chimie", "tr": "Kimya", "ur": "کیمیا", "es": "Química", "de": "Chemie", "id": "Kimia", "bn": "রসায়ন"},
    {"icon": "📜", "ar": "التاريخ", "en": "History", "fr": "Histoire", "tr": "Tarih", "ur": "تاریخ", "es": "Historia", "de": "Geschichte", "id": "Sejarah", "bn": "ইতিহাস"},
    {"icon": "🌍", "ar": "الجغرافيا", "en": "Geography", "fr": "Géographie", "tr": "Coğrafya", "ur": "جغرافیہ", "es": "Geografía", "de": "Geografie", "id": "Geografi", "bn": "ভূগোল"},
]

CURRICULA = [
    {"country": "المملكة الأردنية الهاشمية", "year": 2026, "grade_level": 1,
     "ar": "المنهاج الوطني الموحد", "en": "National Curriculum",
     "fr": "Programme National Unifié", "tr": "Ulusal Müfredat", "ur": "قومی نصاب",
     "es": "Currículo Nacional Unificado", "de": "Einheitlicher Nationaler Lehrplan",
     "id": "Kurikulum Nasional Terpadu", "bn": "জাতীয় পাঠ্যক্রম"},
]

LANGS = ['ar', 'en', 'fr', 'tr', 'ur', 'es', 'de', 'id', 'bn']

# Academic tracks for secondary grades (11-12) — Jordan system 2026/2027
# These are templates; admins can add/remove tracks per school via the admin UI.
SECONDARY_TRACKS = [
    {"code": "scientific_engineering",
     "ar": "العلوم والتكنولوجيا والهندسة", "en": "Science, Technology & Engineering",
     "order": 1},
    {"code": "humanities",
     "ar": "العلوم الإنسانية والاجتماعية", "en": "Humanities & Social Sciences",
     "order": 2},
    {"code": "business",
     "ar": "الأعمال", "en": "Business",
     "order": 3},
    {"code": "health",
     "ar": "الصحي", "en": "Health",
     "order": 4},
]


def _tr(item):
    translations = {}
    for lang in LANGS:
        if item.get(lang):
            translations[lang] = {"name": item[lang]}
    return translations


class Command(BaseCommand):
    help = "Seed academics data (grades, subjects, curricula) with 9-language translations"

    def handle(self, *args, **options):
        created_g = updated_g = 0
        for g in GRADES:
            has_tracks = g["level"] in (11, 12)
            obj, was_created = Grade.objects.update_or_create(
                level=g["level"],
                defaults={"translations": _tr(g), "has_tracks": has_tracks}
            )
            if was_created:
                created_g += 1
            else:
                if obj.has_tracks != has_tracks:
                    obj.has_tracks = has_tracks
                    obj.save(update_fields=['has_tracks'])
                updated_g += 1
        self.stdout.write(f"Grades: {created_g} created, {updated_g} updated")

        created_s = updated_s = 0
        for s in SUBJECTS:
            obj, was_created = Subject.objects.update_or_create(
                icon=s["icon"], defaults={"translations": _tr(s)}
            )
            if was_created:
                created_s += 1
            else:
                updated_s += 1
        self.stdout.write(f"Subjects: {created_s} created, {updated_s} updated")

        # Seed academic tracks for secondary grades (11-12)
        created_t = updated_t = 0
        secondary_grades = Grade.objects.filter(level__in=[11, 12])
        for grade in secondary_grades:
            for t in SECONDARY_TRACKS:
                translations = {lang: {"name": t[lang]} for lang in LANGS if t.get(lang)}
                obj, was_created = AcademicTrack.objects.update_or_create(
                    country="المملكة الأردنية الهاشمية", year=2026,
                    grade=grade, code=t["code"],
                    defaults={"translations": translations, "order": t["order"]}
                )
                if was_created:
                    created_t += 1
                else:
                    updated_t += 1
        self.stdout.write(f"Academic tracks: {created_t} created, {updated_t} updated")

        created_c = updated_c = 0
        for c in CURRICULA:
            grade = Grade.objects.filter(level=c["grade_level"]).first()
            if not grade:
                self.stdout.write(f"  Skipping curriculum for grade level {c['grade_level']} (not found)")
                continue
            obj, was_created = Curriculum.objects.update_or_create(
                country=c["country"], year=c["year"], grade=grade,
                defaults={"translations": _tr(c)}
            )
            if was_created:
                created_c += 1
            else:
                updated_c += 1
        self.stdout.write(f"Curricula: {created_c} created, {updated_c} updated")

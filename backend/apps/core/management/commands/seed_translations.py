"""زرع مفاتيح الترجمات من ملفات JSON الخاصة بالواجهة الأمامية إلى قاعدة البيانات."""

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.core.models import TranslationKey
from apps.core.translation_seed import flatten


class Command(BaseCommand):
    help = "استيراد مفاتيح الترجمات من ملفات messages/*.json للواجهة الأمامية"

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            default="../frontend/src/i18n/messages",
            help="المسار إلى مجلد ملفات رسائل الواجهة الأمامية",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="حذف جميع المفاتيح الحالية قبل الزرع",
        )

    def handle(self, *args, **options):
        path = Path(options["path"])
        if not path.is_absolute():
            path = (Path(__file__).resolve().parents[4] / path).resolve()
        if not path.is_dir():
            raise CommandError(f"المسار غير موجود: {path}")

        if options["clear"]:
            deleted, _ = TranslationKey.objects.all().delete()
            self.stdout.write(f"تم حذف {deleted[0] if deleted else 0} مفتاح موجود")

        files = sorted(path.glob("*.json"))
        if not files:
            raise CommandError(f"لا توجد ملفات JSON في {path}")

        combined = {}
        for f in files:
            locale = f.stem
            try:
                with open(f, encoding="utf-8") as fh:
                    data = json.load(fh)
            except json.JSONDecodeError as e:
                self.stderr.write(f"خطأ في {f.name}: {e}")
                continue
            for key, value in flatten(data).items():
                if key not in combined:
                    combined[key] = {}
                combined[key][locale] = value

        created = updated = 0
        existing = {obj.key: obj for obj in TranslationKey.objects.all()}
        to_create = []
        to_update = []
        for order, key in enumerate(sorted(combined)):
            translations = combined[key]
            obj = existing.get(key)
            if obj is None:
                to_create.append(TranslationKey(
                    key=key,
                    namespace=key.split('.')[0] if '.' in key else 'root',
                    translations=translations,
                    is_active=True,
                    order=order,
                ))
                created += 1
            else:
                obj.translations = translations
                obj.order = order
                obj.is_active = True
                obj.namespace = key.split('.')[0] if '.' in key else 'root'
                to_update.append(obj)
                updated += 1

        if to_create:
            TranslationKey.objects.bulk_create(to_create, batch_size=200)
        if to_update:
            TranslationKey.objects.bulk_update(
                to_update,
                ['translations', 'order', 'is_active', 'namespace'],
                batch_size=200,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"تم زرع {len(combined)} مفتاح من {len(files)} ملفات: "
                f"{created} جديد، {updated} محدّث"
            )
        )

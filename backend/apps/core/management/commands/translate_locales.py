"""ترجمة مفاتيح الواجهة الأمامية الناقصة أو المتطابقة مع الإنجليزية باستخدام Google Gemini API."""

import json
import re
import time
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError

from apps.core.translation_seed import flatten

LOCALE_NAMES = {
    "ar": "Arabic",
    "fr": "French",
    "tr": "Turkish",
    "ur": "Urdu",
    "es": "Spanish",
    "de": "German",
    "id": "Indonesian",
    "bn": "Bengali",
    "fa": "Persian (Farsi)",
}


def unflatten(flat_dict):
    """تحويل القاموس المسطح إلى كائنات متداخلة."""
    result = {}
    for dotted_key, value in flat_dict.items():
        parts = dotted_key.split(".")
        d = result
        for part in parts[:-1]:
            if part not in d or not isinstance(d[part], dict):
                d[part] = {}
            d = d[part]
        d[parts[-1]] = value
    return result


class Command(BaseCommand):
    help = "ترجمة مفاتيح الواجهة الأمامية الناقصة أو المتطابقة مع الإنجليزية باستخدام Google Gemini API ومزامنة قاعدة البيانات"

    def add_arguments(self, parser):
        parser.add_argument(
            "--locales",
            nargs="*",
            default=list(LOCALE_NAMES.keys()),
            help="اللغات المستهدفة للترجمة (افتراضي: ar fr tr ur es de id bn fa)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="عدد المفاتيح في كل دفعة ترجمة (افتراضي: 500)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="عرض المفاتيح المستهدفة للترجمة دون استدعاء API أو تعديل الملفات",
        )

    def handle(self, *args, **options):
        try:
            from google import genai
        except ImportError:
            raise CommandError("مكتبة google-genai غير مثبتة. يرجى تثبيتها عبر pip install google-genai")

        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key and not options["dry_run"]:
            raise CommandError("مفتاح GEMINI_API_KEY غير مُعرّف في الإعدادات أو المتغيرات البيئية.")

        messages_dir = Path(settings.BASE_DIR).resolve().parent / "frontend" / "src" / "i18n" / "messages"
        en_file = messages_dir / "en.json"
        if not en_file.is_file():
            raise CommandError(f"ملف الإنجليزية غير موجود: {en_file}")

        try:
            with open(en_file, encoding="utf-8") as fh:
                en_data = json.load(fh)
        except json.JSONDecodeError as e:
            raise CommandError(f"خطأ في قراءة en.json: {e}")

        en_flat = flatten(en_data)
        self.stdout.write(f"تم تحميل {len(en_flat)} مفتاح إنجليزي مرجعي من {en_file}")

        target_locales = options["locales"]
        batch_size = options["batch_size"]
        dry_run = options["dry_run"]

        client = None
        if not dry_run:
            client = genai.Client(api_key=api_key)

        total_translated = 0

        for locale in target_locales:
            if locale == "en":
                continue
            if locale not in LOCALE_NAMES:
                self.stderr.write(f"تحذير: لغة غير معروفة أو غير مدعومة: {locale}")
                continue

            lang_name = LOCALE_NAMES[locale]
            loc_file = messages_dir / f"{locale}.json"

            loc_flat = {}
            if loc_file.is_file():
                try:
                    with open(loc_file, encoding="utf-8") as fh:
                        loc_data = json.load(fh)
                        loc_flat = flatten(loc_data)
                except Exception:
                    pass

            # Find keys where translation is missing, empty, or identical to English (when English has alphabetic chars)
            to_translate = {}
            for k, en_val in en_flat.items():
                loc_val = loc_flat.get(k, "")
                is_missing = not loc_val or not str(loc_val).strip()
                is_identical = (loc_val == en_val) and any(c.isalpha() for c in str(en_val))
                if is_missing or is_identical:
                    to_translate[k] = en_val

            self.stdout.write(f"اللغة [{locale} ({lang_name})]: تم العثور على {len(to_translate)} مفتاح بحاجة للترجمة.")

            if not to_translate:
                for k, en_val in en_flat.items():
                    if k not in loc_flat:
                        loc_flat[k] = en_val
                nested = unflatten(loc_flat)
                with open(loc_file, "w", encoding="utf-8") as fh:
                    json.dump(nested, fh, ensure_ascii=False, indent=2)
                    fh.write("\n")
                continue

            if dry_run:
                continue

            # Batch translation with retry
            keys_list = list(to_translate.keys())
            for i in range(0, len(keys_list), batch_size):
                batch_keys = keys_list[i : i + batch_size]
                batch_dict = {k: to_translate[k] for k in batch_keys}

                system_instruction = (
                    f"You are a professional software localization translator. "
                    f"Translate the values of the given JSON object from English into {lang_name} ({locale}). "
                    f"Preserve all JSON placeholders (like {{name}}, {{count}}, etc.), HTML tags, markdown, and formatting exactly as they are. "
                    f"Return ONLY a valid JSON object with the exact same keys and your translated values. Do not include markdown code blocks or any other text."
                )
                prompt = json.dumps(batch_dict, ensure_ascii=False, indent=2)

                success = False
                for attempt in range(4):
                    try:
                        config = genai.types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_mime_type="application/json",
                        )
                        resp = client.models.generate_content(
                            model="gemini-3.6-flash",
                            contents=prompt,
                            config=config,
                        )
                        raw = resp.text.strip() if resp.text else "{}"
                        if raw.startswith("```"):
                            raw = re.sub(r"^```(?:json)?\n?", "", raw)
                            raw = re.sub(r"\n?```$", "", raw)
                            raw = raw.strip()

                        translated_batch = json.loads(raw)
                        if isinstance(translated_batch, dict):
                            for k, translated_val in translated_batch.items():
                                if k in batch_dict and translated_val:
                                    loc_flat[k] = translated_val
                                    total_translated += 1
                        success = True
                        break
                    except Exception as e:
                        wait_time = (2 ** attempt) * 5
                        self.stderr.write(f"محاولة {attempt + 1} فشلت لـ {locale} (انتظار {wait_time} ثانية): {e}")
                        time.sleep(wait_time)

                if not success:
                    self.stderr.write(f"فشلت ترجمة الدفعة لـ {locale} بعد عدة محاولات.")

            # Ensure all en keys exist in loc_flat
            for k, en_val in en_flat.items():
                if k not in loc_flat:
                    loc_flat[k] = en_val

            # Write updated JSON file
            nested = unflatten(loc_flat)
            with open(loc_file, "w", encoding="utf-8") as fh:
                json.dump(nested, fh, ensure_ascii=False, indent=2)
                fh.write("\n")
            self.stdout.write(self.style.SUCCESS(f"تم تحديث وحفظ ملف {locale}.json بنجاح."))

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Dry-run completed. No files modified."))
            return

        # Step 5: Run seed_translations to sync database
        self.stdout.write("جارٍ تشغيل seed_translations لمزامنة قاعدة البيانات...")
        try:
            call_command("seed_translations")
            self.stdout.write(self.style.SUCCESS("تمت مزامنة قاعدة البيانات بنجاح عبر seed_translations."))
        except Exception as e:
            self.stderr.write(f"خطأ أثناء تنفيذ seed_translations: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                f"اكتملت عملية الترجمة والمزامنة بنجاح! إجمالي المفاتيح المترجمة الجديدة: {total_translated}"
            )
        )

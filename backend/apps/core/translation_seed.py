"""أدوات مزامنة الترجمات بين ملفات messages/*.json للواجهة الأمامية وقاعدة البيانات."""

import json
from pathlib import Path

from django.conf import settings

from .models import Language, TranslationKey

MESSAGES_DIR = Path(settings.BASE_DIR).resolve().parent / "frontend" / "src" / "i18n" / "messages"


def flatten(messages, prefix="", out=None):
    """تحويل الكائنات المتداخلة إلى مفاتيح مسطحة بنقاط: {"a": {"b": "x"}} -> {"a.b": "x"}"""
    if out is None:
        out = {}
    for key, value in messages.items():
        dotted = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            flatten(value, dotted, out)
        else:
            out[dotted] = value
    return out


def load_messages(locale):
    """قراءة ملف messages/{locale}.json وإرجاع قاموس مسطح، أو None إذا لم يوجد."""
    path = MESSAGES_DIR / f"{locale}.json"
    if not path.is_file():
        return None
    try:
        with open(path, encoding="utf-8") as fh:
            return flatten(json.load(fh))
    except json.JSONDecodeError:
        return None


def sync_language_from_messages(language):
    """تعبئة قيم اللغة الجديدة لكل المفاتيح الموجودة من ملف messages/{code}.json.

    تُستدعى تلقائياً عند إضافة لغة جديدة (post_save) ويمكن استدعاؤها يدوياً.
    """
    flat = load_messages(language.code)
    if not flat:
        return 0
    to_update = []
    for obj in TranslationKey.objects.all().iterator():
        value = flat.get(obj.key)
        if value is not None and obj.translations.get(language.code) != value:
            obj.translations = {**obj.translations, language.code: value}
            to_update.append(obj)
    if to_update:
        TranslationKey.objects.bulk_update(to_update, ["translations"], batch_size=200)
    return len(to_update)


def cleanup_language_from_translations(language):
    """إزالة قيم لغة محذوفة من كل TranslationKey (post_delete)."""
    code = language.code
    to_update = []
    for obj in TranslationKey.objects.all().iterator():
        if code in obj.translations:
            obj.translations.pop(code)
            to_update.append(obj)
    if to_update:
        TranslationKey.objects.bulk_update(to_update, ["translations"], batch_size=200)
    return len(to_update)


def sync_key_from_messages(key_obj):
    """تعبئة اللغات الناقصة لمفتاح جديد من ملفات messages/*.json.

    تُستدعى تلقائياً عند إضافة مفتاح جديد (post_save) — لا تمس القيم التي أدخلها المدير.
    """
    changed = False
    for language in Language.objects.filter(is_active=True):
        flat = load_messages(language.code)
        if not flat:
            continue
        value = flat.get(key_obj.key)
        if value is None:
            continue
        current = (key_obj.translations or {}).get(language.code)
        if not current:
            key_obj.translations[language.code] = value
            changed = True
    if changed:
        key_obj.save(update_fields=["translations"])
    return key_obj.translations

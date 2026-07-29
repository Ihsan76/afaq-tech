from django.conf import settings

SUPPORTED_LANGUAGES = ['en', 'ar', 'fr', 'tr', 'es', 'de', 'ru', 'zh', 'ur']
DEFAULT_LANGUAGE = 'en'


def get_translation(translations_dict, locale, field='title', fallback=''):
    if not translations_dict or not isinstance(translations_dict, dict):
        return fallback
    return (
        translations_dict.get(locale, {}).get(field)
        or translations_dict.get(DEFAULT_LANGUAGE, {}).get(field)
        or translations_dict.get('ar', {}).get(field)
        or fallback
    )

from django.core.cache import cache

SITE_CACHE_TTL = 60 * 5
SITE_CACHE_KEY_PREFIX = 'afaq_public'


def invalidate_site_cache() -> None:
    """مسح كل ردود الصفحات العامة المخزنة — يُستدعى بعد أي تعديل محتوى."""
    try:
        cache.delete_pattern(f'*{SITE_CACHE_KEY_PREFIX}*')
    except Exception:
        pass

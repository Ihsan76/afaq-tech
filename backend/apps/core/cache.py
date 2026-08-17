import contextlib
import threading

from django.core.cache import cache

SITE_CACHE_TTL = 60 * 30
SITE_CACHE_KEY_PREFIX = 'afaq_public'

_warming = threading.Lock()


class _FakeRequest:
    """request مقلّد للتدفئة — يحمل locale فقط كما تفعل serializers."""

    def __init__(self, locale):
        self.query_params = {'locale': locale}


def _public_key(kind, *parts):
    return ':'.join([SITE_CACHE_KEY_PREFIX, kind, *[str(p) for p in parts]])


def invalidate_site_cache() -> None:
    """مسح ردود الصفحات العامة وإعادة بنائها في خيط خلفي (حتى لا يلمس الزائر DB عند أول طلب)."""
    with contextlib.suppress(Exception):
        cache.delete_pattern(f'*{SITE_CACHE_KEY_PREFIX}*')
    threading.Thread(target=warm_site_cache, daemon=True).start()


def warm_site_cache() -> None:
    """إعادة بناء كل مفاتيح الصفحات العامة مسبقاً — تُستدعى من الإبطال أو أمر الإدارة بعد النشر."""
    if not _warming.acquire(blocking=False):
        return
    try:
        _do_warm()
    except Exception:
        pass
    finally:
        _warming.release()


def _do_warm() -> None:
    from concurrent.futures import ThreadPoolExecutor

    from apps.core.models import Language
    from apps.pages.views import (
        MenuPublicView,
        PagePublicView,
        SiteSettingsPublicView,
        TemplateListView,
    )
    from apps.themes.views import ThemeDetailView, ThemeListView

    locales = [c for (c,) in Language.objects.filter(is_active=True).values_list('code')]
    if not locales:
        locales = ['ar', 'en']

    tasks = []

    homepage = None
    slugs = []
    from apps.pages.models import Page
    for slug in Page.objects.filter(is_published=True).values_list('slug', flat=True):
        if slug == 'homepage':
            homepage = slug
        else:
            slugs.append(slug)
    if homepage is None:
        homepage = 'homepage'

    from apps.pages.models import MenuItem
    menu_types = list(MenuItem.objects.filter(parent=None).values_list('menu', flat=True).distinct())
    if not menu_types:
        menu_types = ['header', 'footer', 'sidebar']

    from apps.themes.models import Theme
    theme_ids = list(Theme.objects.values_list('pk', flat=True))

    # الأولوية: homepage والقوائم بأهم اللغات أولاً.
    priority = list(dict.fromkeys(locales + ['ar', 'en']))
    for locale in priority:
        tasks.append(('page', locale, homepage))
    for locale in priority:
        for menu_type in menu_types:
            tasks.append(('menu', locale, menu_type))
    for locale in locales:
        for slug in slugs:
            tasks.append(('page', locale, slug))
        tasks.append(('site-settings', locale))
        tasks.append(('templates', locale))
        tasks.append(('themes', locale))
        for theme_id in theme_ids:
            tasks.append(('theme', locale, theme_id))

    def _run(task):
        try:
            kind, locale, *rest = task
            request = _FakeRequest(locale)
            if kind == 'page':
                PagePublicView().get(request, rest[0])
            elif kind == 'menu':
                MenuPublicView().get(request, rest[0])
            elif kind == 'site-settings':
                SiteSettingsPublicView().get(request)
            elif kind == 'templates':
                TemplateListView().get(request)
            elif kind == 'themes':
                ThemeListView().get(request)
            elif kind == 'theme':
                ThemeDetailView().get(request, rest[0])
        except Exception:
            pass

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(_run, tasks))

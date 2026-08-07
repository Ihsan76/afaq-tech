"""Helpers to create in-app notifications and mirror them to browser push."""

import re

from .models import Notification
from .webpush import localized_text, send_web_push

LOCALE_PREFIX_RE = re.compile(r'^/(ar|en|fr|tr|ur|es|de|id|bn|fa)(/|$)')

def localize_link(link, locale):
    """Prefix an app-internal link with the user's locale (e.g. /gamification → /ar/gamification)."""
    locale = locale or 'ar'
    if not link or not link.startswith('/') or link.startswith('http'):
        return link
    if LOCALE_PREFIX_RE.match(link):
        return link
    return f'/{locale}{link}'


def notify(user, *, type, title, body, link='', icon='', push=True):
    """Create an in-app notification (optionally sending a browser push).

    `title`/`body` are multilingual JSON dicts, e.g.
    {'ar': 'طلب جديد', 'en': 'New order'}.
    """
    locale = getattr(user, 'ui_language', '') or 'ar'
    link = localize_link(link, locale)
    notification = Notification.objects.create(
        user=user, type=type, title=title, body=body, link=link, icon=icon,
    )
    if push:
        send_web_push(
            user,
            localized_text(title, locale, 'title', ''),
            localized_text(body, locale, 'title', ''),
            url=link,
            icon=icon,
        )
    return notification


def notify_many(users, *, type, title, body, link='', icon=''):
    """Bulk-create notifications for many recipients (no browser push).

    Accepts a collection of User instances or user ids.
    """
    if not users:
        return []
    if isinstance(next(iter(users)), int):
        from apps.users.models import User
        users = User.objects.filter(id__in=users)
    Notification.objects.bulk_create([
        Notification(user=u, type=type, title=title, body=body, link=link, icon=icon)
        for u in users
    ])
    return list(users)

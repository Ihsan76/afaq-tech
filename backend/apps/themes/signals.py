from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.cache import invalidate_site_cache

from .models import Theme


@receiver([post_save, post_delete], sender=Theme)
def invalidate_public_cache(sender, instance, **kwargs):
    invalidate_site_cache()

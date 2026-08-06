from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.core.cache import invalidate_site_cache

from .models import MenuItem, Page, PageBlock, PageTemplate, SiteSettings


@receiver([post_save, post_delete], sender=Page)
@receiver([post_save, post_delete], sender=PageBlock)
@receiver([post_save, post_delete], sender=MenuItem)
@receiver([post_save, post_delete], sender=PageTemplate)
@receiver([post_save, post_delete], sender=SiteSettings)
def invalidate_public_cache(sender, instance, **kwargs):
    invalidate_site_cache()

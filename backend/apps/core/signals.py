from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Language, TranslationKey
from .translation_seed import sync_key_from_messages, sync_language_from_messages


@receiver(post_save, sender=Language)
def on_language_saved(sender, instance, created, **kwargs):
    if created:
        sync_language_from_messages(instance)


@receiver(post_save, sender=TranslationKey)
def on_translation_key_saved(sender, instance, created, **kwargs):
    if created:
        sync_key_from_messages(instance)

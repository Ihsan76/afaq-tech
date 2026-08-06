from django.core.management.base import BaseCommand

from apps.core.cache import warm_site_cache


class Command(BaseCommand):
    help = 'إعادة بناء كاش الصفحات العامة مسبقاً (يُستدعى بعد النشر)'

    def handle(self, *args, **options):
        warm_site_cache()
        self.stdout.write(self.style.SUCCESS('Site cache warmed.'))

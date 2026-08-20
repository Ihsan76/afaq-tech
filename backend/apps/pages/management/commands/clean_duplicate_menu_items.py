"""Remove duplicate sidebar menu items and clean up ordering."""
from django.core.management.base import BaseCommand

from apps.pages.models import MenuItem


class Command(BaseCommand):
    help = 'Remove duplicate sidebar menu items and re-order'

    def handle(self, *args, **options):
        items = MenuItem.objects.filter(menu='sidebar', service_context__contains=['school']).order_by('order')

        seen_urls = {}
        deleted = 0
        for item in items:
            key = (item.url, tuple(item.required_role or []))
            if key in seen_urls:
                self.stdout.write(f'  Deleting duplicate: id={item.id} {item.url} roles={item.required_role}')
                item.delete()
                deleted += 1
            else:
                seen_urls[key] = item

        self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} duplicate items.'))

        # Show final state
        items = MenuItem.objects.filter(menu='sidebar', required_role__contains=['school_admin']).order_by('order')
        self.stdout.write('\n=== FINAL SCHOOL ADMIN SIDEBAR ===')
        for item in items:
            self.stdout.write(
                f'  {item.order:3d} | {item.url:45s} | {item.icon} | {item.translations.get("ar", {}).get("title", "")}'
            )

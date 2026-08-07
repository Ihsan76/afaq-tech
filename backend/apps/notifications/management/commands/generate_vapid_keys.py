"""Generate a VAPID key pair for Web Push.

Usage:
    python manage.py generate_vapid_keys

Prints the base64url keys to paste into the server .env:
    VAPID_PUBLIC_KEY=...
    VAPID_PRIVATE_KEY=...
    VAPID_SUBJECT=mailto:no-reply@afaq.app
"""
import base64

from cryptography.hazmat.primitives.asymmetric import ec
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Generate VAPID key pair for Web Push (free, no registration needed).'

    def handle(self, *args, **options):
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key = private_key.public_key()

        private_raw = private_key.private_numbers().private_value.to_bytes(32, 'big')
        public_raw = public_key.public_numbers().x.to_bytes(32, 'big') + \
            public_key.public_numbers().y.to_bytes(32, 'big')

        private_b64 = base64.urlsafe_b64encode(private_raw).rstrip(b'=').decode()
        public_b64 = base64.urlsafe_b64encode(public_raw).rstrip(b'=').decode()

        self.stdout.write(self.style.SUCCESS(
            'Add these to the server .env (Render) to enable browser push notifications:\n'
        ))
        self.stdout.write(f'VAPID_PUBLIC_KEY={public_b64}')
        self.stdout.write(f'VAPID_PRIVATE_KEY={private_b64}')
        self.stdout.write('VAPID_SUBJECT=mailto:no-reply@afaq.app')

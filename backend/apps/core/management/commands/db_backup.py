import gzip
import os
import subprocess
import tempfile
from datetime import datetime

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Backup PostgreSQL database and upload to S3'

    def add_arguments(self, parser):
        parser.add_argument('--encrypt', action='store_true', help='Encrypt backup with GPG')
        parser.add_argument('--retention', type=int, default=30, help='Number of backups to retain')

    def handle(self, *args, **options):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'afaq_backup_{timestamp}.sql.gz'
        db_url = settings.DATABASES['default']['NAME']

        self.stdout.write(f'Starting backup: {backup_filename}')

        with tempfile.NamedTemporaryFile(suffix='.sql.gz', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            cmd = [
                'pg_dump',
                '--no-owner',
                '--no-acl',
                '--format=plain',
                db_url,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
            if result.returncode != 0:
                self.stderr.write(f'pg_dump failed: {result.stderr}')
                return

            with gzip.open(tmp_path, 'wb') as f:
                f.write(result.stdout.encode())

            file_size = os.path.getsize(tmp_path)
            self.stdout.write(f'Backup created: {file_size / 1024 / 1024:.2f} MB')

            s3_bucket = os.environ.get('S3_BACKUP_BUCKET', 'afaq-tech-backups')
            s3_prefix = f'database/{timestamp}/'

            upload_cmd = [
                'aws', 's3', 'cp', tmp_path,
                f's3://{s3_bucket}/{s3_prefix}{backup_filename}',
                '--storage-class', 'STANDARD_IA',
            ]

            result = subprocess.run(upload_cmd, capture_output=True, text=True, timeout=1800)
            if result.returncode != 0:
                self.stderr.write(f'S3 upload failed: {result.stderr}')
                return

            self.stdout.write(self.style.SUCCESS(f'Backup uploaded: s3://{s3_bucket}/{s3_prefix}{backup_filename}'))

        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

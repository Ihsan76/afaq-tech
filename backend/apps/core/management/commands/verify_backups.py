import os
import subprocess
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Verify backups exist in S3 within the expected timeframe'

    def handle(self, *args, **options):
        s3_bucket = os.environ.get('S3_BACKUP_BUCKET', 'afaq-tech-backups')
        cutoff = datetime.now() - timedelta(hours=25)

        cmd = [
            'aws', 's3', 'ls',
            f's3://{s3_bucket}/database/',
            '--recursive',
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            self.stderr.write(f'Failed to list S3 backups: {result.stderr}')
            return

        lines = [line for line in result.stdout.strip().split('\n') if line.strip()]
        if not lines:
            self.stderr.write('No backups found in S3!')
            return

        latest = lines[-1]
        parts = latest.split()
        if len(parts) >= 3:
            date_str = ' '.join(parts[:2])
            try:
                backup_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                if backup_date < cutoff:
                    self.stderr.write(f'Latest backup is older than 25 hours: {date_str}')
                else:
                    self.stdout.write(self.style.SUCCESS(f'Latest backup is recent: {date_str}'))
            except ValueError:
                self.stderr.write(f'Could not parse backup date: {date_str}')

        self.stdout.write(f'Total backups found: {len(lines)}')

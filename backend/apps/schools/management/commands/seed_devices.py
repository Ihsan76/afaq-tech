"""Seed sample school devices for demo purposes."""

import secrets

from django.core.management.base import BaseCommand

from apps.schools.models import School, SchoolBus, SchoolDevice

DEVICES = [
    {
        'name': 'بوابة المدرسة الرئيسية',
        'device_type': SchoolDevice.DeviceType.RFID_READER,
        'device_identifier': 'RFID-GATE-001',
        'assigned_gate': 'البوابة الرئيسية',
    },
    {
        'name': 'بوابة المدرسة الخلفية',
        'device_type': SchoolDevice.DeviceType.RFID_READER,
        'device_identifier': 'RFID-GATE-002',
        'assigned_gate': 'البوابة الخلفية',
    },
    {
        'name': 'كاميرا المدخل - صالة الاستقبال',
        'device_type': SchoolDevice.DeviceType.FACIAL_CAMERA,
        'device_identifier': 'CAM-001',
        'assigned_gate': 'صالة الاستقبال',
    },
    {
        'name': 'كاميرا الباب الخارجي',
        'device_type': SchoolDevice.DeviceType.FACIAL_CAMERA,
        'device_identifier': 'CAM-002',
        'assigned_gate': 'الباب الخارجي',
    },
]


def _create_bus_devices(school):
    buses = SchoolBus.objects.filter(school=school)
    created = []
    for bus in buses:
        dev_id = f'GPS-{bus.bus_number}'
        dev, is_new = SchoolDevice.objects.get_or_create(
            device_identifier=dev_id,
            defaults={
                'school': school,
                'name': f'جهاز تتبع حافلة رقم {bus.bus_number}',
                'device_type': SchoolDevice.DeviceType.GPS_TRACKER,
                'api_token': secrets.token_hex(32),
                'assigned_bus': bus,
                'status': SchoolDevice.Status.OFFLINE,
            },
        )
        if is_new:
            created.append(dev)

        phone_id = f'DRIVER-PHONE-{bus.bus_number}'
        phone, is_new = SchoolDevice.objects.get_or_create(
            device_identifier=phone_id,
            defaults={
                'school': school,
                'name': f'هاتف سائق الحافلة {bus.bus_number} ({bus.driver_name})',
                'device_type': SchoolDevice.DeviceType.MOBILE_APP,
                'api_token': secrets.token_hex(32),
                'assigned_bus': bus,
                'status': SchoolDevice.Status.OFFLINE,
            },
        )
        if is_new:
            created.append(phone)
    return created


class Command(BaseCommand):
    help = 'Seed sample school devices (RFID readers, cameras, GPS trackers, mobile apps)'

    def handle(self, *args, **options):
        schools = School.objects.all()
        if not schools.exists():
            self.stdout.write(self.style.WARNING('No schools found. Run seed_school_data first.'))
            return

        total = 0
        for school in schools:
            for d in DEVICES:
                dev, is_new = SchoolDevice.objects.get_or_create(
                    device_identifier=d['device_identifier'],
                    defaults={
                        'school': school,
                        'name': d['name'],
                        'device_type': d['device_type'],
                        'api_token': secrets.token_hex(32),
                        'assigned_gate': d.get('assigned_gate', ''),
                        'status': SchoolDevice.Status.OFFLINE,
                    },
                )
                if is_new:
                    total += 1

            bus_devices = _create_bus_devices(school)
            total += len(bus_devices)

        self.stdout.write(self.style.SUCCESS(f'Created {total} new devices.'))

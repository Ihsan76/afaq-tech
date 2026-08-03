from django.db import migrations

# Default per-currency display prices keyed by plan code (SAR is the base/gateway currency).
PRICES = {
    'free': {},
    'pro': {
        'SAR': '9.99',
        'JOD': '1.90',
        'USD': '2.66',
        'AED': '9.77',
        'EGP': '80.00',
        'EUR': '2.45',
        'TRY': '90.00',
    },
    'school': {
        'SAR': '49.99',
        'JOD': '9.50',
        'USD': '13.33',
        'AED': '49.00',
        'EGP': '400.00',
        'EUR': '12.30',
        'TRY': '450.00',
    },
    'enterprise': {
        'SAR': '199.00',
        'JOD': '38.00',
        'USD': '53.00',
        'AED': '195.00',
        'EGP': '1600.00',
        'EUR': '49.00',
        'TRY': '1800.00',
    },
}


def seed_prices(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    for code, prices in PRICES.items():
        Plan.objects.filter(code=code).update(prices=prices)


def unseed_prices(apps, schema_editor):
    Plan = apps.get_model('subscriptions', 'Plan')
    Plan.objects.filter(code__in=PRICES.keys()).update(prices={})


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0003_plan_prices_subscription_display_currency_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_prices, unseed_prices),
    ]

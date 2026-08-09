from decimal import Decimal

from ..models import Wallet, WalletTransaction


def credit_earnings(user, gross_amount, currency, reference, fee_percent=Decimal('10')):
    """Add a provider's net earnings (after platform fee) to their wallet.

    Returns the provider's net earning amount. Creates a SALE_EARNING
    transaction. Idempotent by call site (callers must guard on already-paid).
    """
    if not user:
        return None
    fee_percent = Decimal(fee_percent)
    gross = Decimal(gross_amount)
    platform_fee = (gross * fee_percent) / Decimal('100')
    provider_earning = gross - platform_fee

    wallet, _ = Wallet.objects.get_or_create(user=user, defaults={'currency': currency})
    wallet.balance += provider_earning
    wallet.save(update_fields=['balance', 'updated_at'])

    WalletTransaction.objects.create(
        wallet=wallet,
        amount=provider_earning,
        transaction_type=WalletTransaction.Type.SALE_EARNING,
        reference_id=reference,
        description=f"Earning for {reference} (after {fee_percent}% platform fee)",
    )
    return provider_earning

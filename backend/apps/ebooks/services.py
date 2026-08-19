from django.utils import timezone

from apps.marketplace.payments.wallet import credit_earnings

from .models import EbookPurchase


def activate_ebook_purchase(purchase_id, transaction_id='', provider_name=''):
    """Idempotently mark an ebook purchase as paid (lifetime download access)."""
    try:
        purchase = EbookPurchase.objects.select_related(
            'user', 'ebook', 'ebook__author_role'
        ).get(id=purchase_id)
    except (EbookPurchase.DoesNotExist, ValueError, TypeError):
        return False
    if purchase.status == EbookPurchase.Status.PAID and purchase.purchased_at:
        return True

    now = timezone.now()
    purchase.status = EbookPurchase.Status.PAID
    purchase.payment_transaction_id = transaction_id or purchase.payment_transaction_id
    purchase.payment_provider = provider_name or purchase.payment_provider
    purchase.purchased_at = now
    purchase.save(update_fields=[
        'status',
        'payment_transaction_id',
        'payment_provider',
        'purchased_at',
        'updated_at',
    ])

    ebook = purchase.ebook
    author = ebook.author
    if author:
        credit_earnings(
            author,
            purchase.price_paid,
            purchase.currency,
            reference=f"ebook_purchase_{purchase.id}",
            fee_percent=ebook.platform_fee_percent,
        )

    from apps.notifications.services import notify
    title = ((ebook.translations or {}).get('ar') or {}).get('title') or ebook.slug
    notify(
        purchase.user,
        type='payment',
        title={'ar': 'تم تأكيد الدفع', 'en': 'Payment confirmed'},
        body={
            'ar': f"تم شراء الكتاب: {title} — التنزيل متاح الآن مدى الحياة",
            'en': f"Ebook purchased: {ebook.slug} — download is now available",
        },
        link=f"/ebooks/{ebook.slug}/",
        icon='📚',
    )
    return True

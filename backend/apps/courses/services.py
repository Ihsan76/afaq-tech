from django.utils import timezone

from apps.marketplace.payments.wallet import credit_earnings

from .models import CoursePurchase, Enrollment


def activate_course_purchase(purchase_id, transaction_id='', provider_name=''):
    """Idempotently mark a course purchase as paid and grant lifetime access."""
    try:
        purchase = CoursePurchase.objects.select_related(
            'user', 'course', 'course__instructor_role'
        ).get(id=purchase_id)
    except (CoursePurchase.DoesNotExist, ValueError, TypeError):
        return False
    if purchase.status == CoursePurchase.Status.PAID and purchase.purchased_at:
        return True

    now = timezone.now()
    purchase.status = CoursePurchase.Status.PAID
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

    course = purchase.course
    # Lifetime access = an enrollment that never expires.
    Enrollment.objects.get_or_create(user=purchase.user, course=course)

    instructor = course.instructor
    if instructor:
        credit_earnings(
            instructor,
            purchase.price_paid,
            purchase.currency,
            reference=f"course_purchase_{purchase.id}",
            fee_percent=course.platform_fee_percent,
        )

    from apps.notifications.services import notify
    title = ((course.translations or {}).get('ar') or {}).get('title') or course.slug
    notify(
        purchase.user,
        type='payment',
        title={'ar': 'تم تأكيد الدفع', 'en': 'Payment confirmed'},
        body={
            'ar': f"تم شراء الدورة: {title} — وصول مدى الحياة متاح الآن",
            'en': f"Course purchased: {course.slug} — lifetime access is now available",
        },
        link=f"/academy/courses/{course.slug}/",
        icon='🎓',
    )
    return True

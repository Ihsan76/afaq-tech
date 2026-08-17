from celery import shared_task
from django.utils import timezone

from .models import FamilyLink
from .whatsapp import send_whatsapp_alert


@shared_task(bind=True, max_retries=3)
def send_async_absence_alert(self, student_id):
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        student = User.objects.get(pk=student_id)
        family_links = FamilyLink.objects.filter(student=student)
        for link in family_links:
            if link.parent and link.parent.phone:
                msg = f"إشعار غياب مدرسي: نود إعلامكم بتسجيل غياب الطالب {student.get_full_name() or student.email} ليوم {timezone.localdate()}."
                send_whatsapp_alert(link.parent.phone, msg)
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60) from None  # noqa: B904

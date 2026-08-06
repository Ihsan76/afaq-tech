import logging

import requests
from django.conf import settings

from .models import WhatsAppNotificationLog

logger = logging.getLogger(__name__)


def send_whatsapp_alert(recipient_phone: str, message: str) -> bool:
    """
    Sends an emergency or quick alert via WhatsApp Cloud API or Twilio.
    Falls back to logging if credentials are not configured.
    """
    if not recipient_phone:
        return False

    # Check for WhatsApp Cloud API settings or log mock
    whatsapp_token = getattr(settings, 'WHATSAPP_CLOUD_TOKEN', None)
    whatsapp_phone_id = getattr(settings, 'WHATSAPP_PHONE_ID', None)

    success = False
    error_msg = ""

    if whatsapp_token and whatsapp_phone_id:
        url = f"https://graph.facebook.com/v17.0/{whatsapp_phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {whatsapp_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": recipient_phone,
            "type": "text",
            "text": {"body": message}
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            if resp.status_code in (200, 201):
                success = True
            else:
                error_msg = resp.text
        except Exception as e:
            error_msg = str(e)
    else:
        # Development / Mock mode: log to console & DB
        logger.info(f"[WHATSAPP MOCK] To {recipient_phone}: {message}")
        success = True

    WhatsAppNotificationLog.objects.create(
        recipient_phone=recipient_phone,
        message=message,
        status='sent' if success else 'failed',
        error_message=error_msg
    )
    return success

"""
Email utility using Resend API.
https://resend.com/docs/api-reference/emails/send-email
"""
import logging

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

RESEND_API_URL = "https://api.resend.com/emails"


def send_email(to: str | list[str], subject: str, html: str, from_email: str | None = None) -> bool:
    """Send an email via Resend. Returns True on success, False on failure (fails silently)."""
    api_key = getattr(settings, 'RESEND_API_KEY', None)
    if not api_key:
        logger.warning("RESEND_API_KEY not configured — email not sent: %s", subject)
        return False

    if isinstance(to, str):
        to = [to]

    payload = {
        "from": from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'Afaq Tech <onboarding@resend.dev>'),
        "to": to,
        "subject": subject,
        "html": html,
    }

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(
                RESEND_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
        if resp.status_code in (200, 201):
            return True
        logger.error("Resend error %s: %s", resp.status_code, resp.text[:300])
        return False
    except Exception as e:
        logger.error("Email send failed: %s", e)
        return False


def password_reset_email(reset_url: str, locale: str = 'ar') -> str:
    """HTML template for password reset email."""
    if locale == 'ar':
        return f"""
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; margin: 0;">آفاق تكنولوجي</h1>
            </div>
            <h2 style="color: #333;">إعادة تعيين كلمة المرور</h2>
            <p style="color: #555; line-height: 1.8;">تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">إعادة تعيين كلمة المرور</a>
            </div>
            <p style="color: #888; font-size: 14px;">هذا الرابط صالح لمدة 24 ساعة. إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">© آفاق تكنولوجي — منصة رقمية للخدمات والتعليم</p>
        </div>
        """
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">Afaq Tech</h1>
        </div>
        <h2 style="color: #333;">Password Reset</h2>
        <p style="color: #555; line-height: 1.8;">We received a request to reset your account password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="background: #4F46E5; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 14px;">This link is valid for 24 hours. If you didn't request a reset, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">© Afaq Tech — Digital platform for services and education</p>
    </div>
    """


def verification_email(code: str, locale: str = 'ar') -> str:
    """HTML template for email verification code."""
    if locale == 'ar':
        return f"""
        <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4F46E5; margin: 0;">آفاق تكنولوجي</h1>
            </div>
            <h2 style="color: #333;">تأكيد البريد الإلكتروني</h2>
            <p style="color: #555; line-height: 1.8;">استخدم الرمز التالي لتأكيد بريدك الإلكتروني:</p>
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f6f6f6; border-radius: 12px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">{code}</span>
            </div>
            <p style="color: #888; font-size: 14px;">هذا الرمز صالح لمدة ساعة واحدة. إذا لم تطلب هذا الرمز، تجاهل هذه الرسالة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #aaa; font-size: 12px; text-align: center;">© آفاق تكنولوجي — منصة رقمية للخدمات والتعليم</p>
        </div>
        """
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">Afaq Tech</h1>
        </div>
        <h2 style="color: #333;">Email Verification</h2>
        <p style="color: #555; line-height: 1.8;">Use the code below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f6f6f6; border-radius: 12px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5;">{code}</span>
        </div>
        <p style="color: #888; font-size: 14px;">This code is valid for one hour. If you didn't request this, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">© Afaq Tech — Digital platform for services and education</p>
    </div>
    """


def contact_notification_email(name: str, email: str, phone: str, subject: str, message: str, service: str) -> str:
    """HTML template for admin contact notification."""
    rows = "".join([
        f"<tr><td style='padding: 8px; color: #888; width: 120px;'>{label}</td><td style='padding: 8px; color: #333;'>{value or '—'}</td></tr>"
        for label, value in [
            ("Name", name), ("Email", email), ("Phone", phone),
            ("Subject", subject), ("Service", service),
        ]
    ])
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">New Contact Message — Afaq Tech</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">{rows}</table>
        <div style="background: #f6f6f6; padding: 16px; border-radius: 8px; color: #333; line-height: 1.8;">{message}</div>
    </div>
    """

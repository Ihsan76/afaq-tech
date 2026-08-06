import base64
import hashlib
import json
import secrets
from datetime import timedelta
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Sum
from django.http import HttpResponseRedirect
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.throttling import ResilientScopedRateThrottle
from apps.lessonplans.models import LessonPlan

from .models import EmailVerification, LoginAttempt
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _frontend_base():
    value = (getattr(settings, 'FRONTEND_URL', '') or '').strip().rstrip('/')
    if ',' in value:
        value = value.split(',')[0].strip().rstrip('/')
    if value.startswith(('http://', 'https://')):
        return value
    return 'http://localhost:3000'


def _record_login_attempt(email, ip, successful):
    LoginAttempt.objects.create(email=email.lower(), ip_address=ip, successful=successful)


def _is_locked_out(email, window_minutes=15, max_failures=5):
    since = timezone.now() - timedelta(minutes=window_minutes)
    failures = LoginAttempt.objects.filter(
        email=email.lower(), successful=False, attempted_at__gte=since
    ).count()
    return failures >= max_failures


def send_verification_code(user, locale='ar', purpose='verify_email'):
    """Generate, store (hashed) and email a 6-digit code. Returns the plain code only for dev when Resend is unconfigured."""
    from apps.core.email import send_email, verification_email

    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    EmailVerification.objects.filter(user=user, purpose=purpose, used=False).delete()
    EmailVerification.objects.create(
        user=user,
        code_hash=code_hash,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(hours=1),
    )
    sent = send_email(
        to=user.email,
        subject='Email Verification — Afaq Tech',
        html=verification_email(code, locale),
    )
    return code if not sent else None


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_register'

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        debug_code = None
        if not settings.RESEND_API_KEY:
            debug_code = send_verification_code(user, request.data.get('locale', 'ar'))
        else:
            send_verification_code(user, request.data.get('locale', 'ar'))
        return Response({
            'user': UserSerializer(user).data,
            'verification_sent': True,
            'debug_code': debug_code,
            **tokens
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        ip = _client_ip(request)

        if email:
            email = email.lower()
            if _is_locked_out(email):
                return Response({'error': 'Too many failed attempts. Try again in 15 minutes.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        user = authenticate(email=email, password=password)

        if user:
            _record_login_attempt(email or '', ip, successful=True)
            tokens = get_tokens_for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                **tokens
            })
        _record_login_attempt(email or '', ip, successful=False)
        return Response({'error': 'Invalid login credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


# ── Admin — User Management ──

class UserAdminListView(generics.ListAPIView):
    """User list — admin only"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        plan = self.request.query_params.get('plan')
        if plan:
            qs = qs.filter(subscription_plan=plan)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(email__icontains=search)
        return qs


class UserAdminUpdateView(generics.RetrieveUpdateAPIView):
    """User edit — role and subscription plan"""
    queryset = User.objects.all()
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, *args, **kwargs):
        user = self.get_object()
        allowed = ['role', 'subscription_plan', 'is_verified', 'is_active']
        for field in allowed:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        return Response(UserSerializer(user, context={'request': request}).data)

class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token),
                'refresh': str(token),
            })
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_reset'

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        from apps.core.email import password_reset_email, send_email

        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Always return success to prevent email enumeration
        try:
            user = User.objects.get(email=email)
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            locale = request.data.get('locale', 'ar')
            frontend_url = _frontend_base()
            reset_url = f"{frontend_url}/{locale}/reset-password?uid={uid}&token={token}"
            send_email(
                to=email,
                subject='Password Reset — Afaq Tech',
                html=password_reset_email(reset_url, locale),
            )
        except User.DoesNotExist:
            pass
        return Response({'message': 'If the email is registered, a reset link has been sent'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_reset'

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uid or not token or not password:
            return Response({'error': 'Incomplete data'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(password, user=user)
        except ValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Link expired or invalid'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    user = request.user
    plans = LessonPlan.objects.filter(user=user)

    total_plans = plans.count()
    published_plans = plans.filter(is_public=True, status='published').count()
    total_likes = sum(p.likes_count for p in plans.iterator())
    total_clones = sum(p.clones_count for p in plans.iterator())
    total_downloads = sum(p.downloads_count for p in plans.iterator())

    streak_data = {}
    badges_detail = []
    level_data = {}
    try:
        from apps.gamification.models import Level, PointsTransaction, UserBadge, UserStreak
        streak = UserStreak.objects.filter(user=user).first()
        if streak:
            streak_data = {'current': streak.current_streak, 'longest': streak.longest_streak}
        ub = UserBadge.objects.filter(user=user).select_related('badge')
        for b in ub:
            badges_detail.append({
                'name': b.badge.name,
                'rarity': b.badge.rarity,
                'earned_at': b.earned_at,
            })
        total_pts = PointsTransaction.objects.filter(user=user).aggregate(
            total=Sum('points')
        )['total'] or 0
        current_lvl = Level.objects.filter(
            points_required__lte=total_pts
        ).order_by('-points_required').first()
        if current_lvl:
            level_data = {'number': current_lvl.number, 'name': current_lvl.name}
    except Exception:
        pass

    return Response({
        'points': user.points,
        'badges': user.badges,
        'badges_detail': badges_detail,
        'streak': streak_data,
        'level': level_data,
        'lessons_created_count': user.lessons_created_count or total_plans,
        'total_plans': total_plans,
        'published_plans': published_plans,
        'total_likes': total_likes,
        'total_clones': total_clones,
        'total_downloads': total_downloads,
    })


# ── Auth hardening: logout, email verification, Google OAuth ──

class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_login'

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Logged out successfully'})


class VerifyEmailView(APIView):
    """Send (or resend) a verification code to the user's email."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_verify'

    def post(self, request):
        email = request.data.get('email', '').lower()
        locale = request.data.get('locale', 'ar')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If the email is registered, a verification code has been sent'})

        debug_code = send_verification_code(user, locale)
        return Response({
            'message': 'Verification code sent',
            'debug_code': debug_code if not settings.RESEND_API_KEY else None,
        })


class VerifyEmailConfirmView(APIView):
    """Confirm a verification code and mark the user's email as verified."""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ResilientScopedRateThrottle]
    throttle_scope = 'auth_verify'

    def post(self, request):
        email = request.data.get('email', '').lower()
        code = request.data.get('code', '')
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

        verification = EmailVerification.objects.filter(
            user=user, purpose='verify_email', used=False
        ).order_by('-created_at').first()

        if not verification or not verification.is_valid():
            return Response({'error': 'Code expired or already used'}, status=status.HTTP_400_BAD_REQUEST)
        if verification.code_hash != hashlib.sha256(code.encode()).hexdigest():
            return Response({'error': 'Invalid code'}, status=status.HTTP_400_BAD_REQUEST)

        verification.used = True
        verification.save()
        user.is_verified = True
        user.save(update_fields=['is_verified'])
        return Response({'message': 'Email verified successfully', 'user': UserSerializer(user).data})


def _state_payload(locale):
    raw = json.dumps({'locale': locale, 'nonce': secrets.token_urlsafe(16)})
    return base64.urlsafe_b64encode(raw.encode()).decode()


def _decode_state(state):
    try:
        raw = base64.urlsafe_b64decode(state.encode()).decode()
        return json.loads(raw)
    except Exception:
        return {'locale': 'ar'}


class GoogleLoginView(APIView):
    """Starts the Google OAuth Authorization Code flow."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        if not client_id or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
            return Response({'error': 'Google OAuth is not configured yet'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        locale = request.GET.get('locale', 'ar')
        params = {
            'client_id': client_id,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope': 'openid email profile',
            'state': _state_payload(locale),
            'prompt': 'select_account',
        }
        return HttpResponseRedirect(f"{settings.GOOGLE_AUTH_URI}?{urlencode(params)}")


class GoogleCallbackView(APIView):
    """Exchanges the Google auth code for tokens and signs the user in."""
    permission_classes = [permissions.AllowAny]

    def _redirect_frontend(self, locale, **params):
        url = f"{_frontend_base()}/{locale}/auth/google/callback"
        if params:
            url = f"{url}?{urlencode(params)}"
        return HttpResponseRedirect(url)

    def get(self, request):
        code = request.GET.get('code')
        state = request.GET.get('state')
        locale = _decode_state(state).get('locale', 'ar')

        if not code:
            return self._redirect_frontend(locale, error='access_denied')

        if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
            return self._redirect_frontend(locale, error='not_configured')

        try:
            token_resp = requests.post(
                settings.GOOGLE_TOKEN_URI,
                data={
                    'code': code,
                    'client_id': settings.GOOGLE_OAUTH_CLIENT_ID,
                    'client_secret': settings.GOOGLE_OAUTH_CLIENT_SECRET,
                    'redirect_uri': settings.GOOGLE_REDIRECT_URI,
                    'grant_type': 'authorization_code',
                },
                timeout=15,
            )
            token_data = token_resp.json()
            if 'access_token' not in token_data:
                return self._redirect_frontend(locale, error='token_exchange_failed')

            userinfo_resp = requests.get(
                settings.GOOGLE_USERINFO_URI,
                headers={'Authorization': f"Bearer {token_data['access_token']}"},
                timeout=15,
            )
            info = userinfo_resp.json()
        except requests.RequestException:
            return self._redirect_frontend(locale, error='google_unreachable')

        email = (info.get('email') or '').lower()
        if not email or not info.get('verified_email', True):
            return self._redirect_frontend(locale, error='invalid_google_account')

        name = info.get('name') or info.get('given_name') or email.split('@')[0]
        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(email=email, password=secrets.token_urlsafe(32))
            user.translations = {'ar': {'name': name}, 'en': {'name': name}}
            user.is_verified = True
            user.avatar = info.get('picture', '')
            user.save()
        elif not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        tokens = get_tokens_for_user(user)
        return self._redirect_frontend(locale, access=tokens['access'], refresh=tokens['refresh'])

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Sum
from .serializers import UserSerializer, RegisterSerializer
from apps.lessonplans.models import LessonPlan

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            **tokens
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        user = authenticate(email=email, password=password)
        
        if user:
            tokens = get_tokens_for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                **tokens
            })
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

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from apps.core.email import send_email, password_reset_email

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
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
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

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uid or not token or not password:
            return Response({'error': 'Incomplete data'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)

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
        from apps.gamification.models import UserStreak, Level, PointsTransaction, UserBadge
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

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    Achievement,
    Badge,
    Challenge,
    ChallengeParticipant,
    Leaderboard,
    Level,
    PointsTransaction,
    UserAchievement,
    UserBadge,
)
from .serializers import (
    AchievementSerializer,
    BadgeSerializer,
    ChallengeParticipantSerializer,
    ChallengeSerializer,
    LeaderboardSerializer,
    LevelSerializer,
    PointsTransactionSerializer,
    UserAchievementSerializer,
    UserBadgeSerializer,
)
from .services import (
    ChallengeManager,
    LeaderboardManager,
    StreakTracker,
)

# ── Points ──

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def points_summary(request):
    user = request.user
    total_earned = PointsTransaction.objects.filter(user=user).aggregate(
        total=Sum('points')
    )['total'] or 0
    today = PointsTransaction.objects.filter(
        user=user, created_at__date=__import__('datetime').date.today()
    ).aggregate(total=Sum('points'))['total'] or 0
    return Response({
        'current': user.points,
        'total_earned': total_earned,
        'today': today,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def points_history(request):
    transactions = PointsTransaction.objects.filter(user=request.user)[:50]
    return Response(PointsTransactionSerializer(transactions, many=True).data)


# ── Badges ──

class BadgeListView(generics.ListAPIView):
    queryset = Badge.objects.filter(is_active=True)
    serializer_class = BadgeSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_badges(request):
    badges = UserBadge.objects.filter(user=request.user).select_related('badge')
    return Response(UserBadgeSerializer(badges, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_badge_seen(request, pk):
    badge = get_object_or_404(UserBadge, pk=pk, user=request.user)
    badge.seen = True
    badge.save(update_fields=['seen'])
    return Response({'status': 'seen'})


# ── Achievements ──

class AchievementListView(generics.ListAPIView):
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_achievements(request):
    achievements = UserAchievement.objects.filter(
        user=request.user
    ).select_related('achievement')
    return Response(UserAchievementSerializer(achievements, many=True).data)


# ── Challenges ──

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def active_challenges(request):
    challenges = ChallengeManager.get_active_challenges()
    return Response(ChallengeSerializer(challenges, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def join_challenge(request, pk):
    try:
        result = ChallengeManager.join_challenge(request.user, pk)
        return Response({'success': result['success']}, status=status.HTTP_201_CREATED)
    except Challenge.DoesNotExist:
        return Response({'error': 'Challenge not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_challenges(request):
    participations = ChallengeParticipant.objects.filter(
        user=request.user
    ).select_related('challenge')
    return Response(ChallengeParticipantSerializer(participations, many=True).data)


# ── Streak ──

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def streak_status(request):
    data = StreakTracker.get_streak(request.user)
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def streak_checkin(request):
    data = StreakTracker.record_daily_activity(request.user)
    return Response(data)


# ── Leaderboard ──

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def leaderboard_view(request):
    period = request.query_params.get('period', 'weekly')
    category = request.query_params.get('category', 'points')
    board = Leaderboard.objects.filter(period=period, category=category).first()
    if not board:
        board = LeaderboardManager.update_leaderboard(period, category)
    return Response(LeaderboardSerializer(board).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_rank(request):
    period = request.query_params.get('period', 'weekly')
    category = request.query_params.get('category', 'points')
    data = LeaderboardManager.get_user_rank(request.user.id, period, category)
    return Response(data)


# ── Levels ──

class LevelListView(generics.ListAPIView):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_level(request):
    total_points = PointsTransaction.objects.filter(user=request.user).aggregate(
        total=Sum('points')
    )['total'] or 0
    current_level = Level.objects.filter(
        points_required__lte=total_points
    ).order_by('-points_required').first()
    next_level = Level.objects.filter(
        points_required__gt=total_points
    ).order_by('points_required').first()
    return Response({
        'current_level': LevelSerializer(current_level).data if current_level else None,
        'next_level': LevelSerializer(next_level).data if next_level else None,
        'total_points': total_points,
        'progress': (
            (total_points - current_level.points_required) /
            (next_level.points_required - current_level.points_required) * 100
            if current_level and next_level and next_level.points_required > current_level.points_required
            else 100 if current_level and not next_level
            else 0
        ),
    })

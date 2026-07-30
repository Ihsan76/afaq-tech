from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Sum, Count
from .models import PointsTransaction, Level, Badge, UserBadge, UserStreak, Achievement, UserAchievement, Challenge, ChallengeParticipant, Leaderboard


class PointsManager:
    POINTS = {
        'lesson_complete': 10,
        'lesson_created': 10,
        'quiz_perfect': 25,
        'quiz_pass': 15,
        'course_complete': 100,
        'course_review': 5,
        'daily_login': 5,
        'consecutive_days_3': 15,
        'consecutive_days_7': 35,
        'consecutive_days_30': 100,
        'blog_post': 20,
        'blog_comment': 2,
        'helpful_answer': 10,
        'product_upload': 15,
        'first_sale': 50,
        'sale': 10,
        'badge_earned': 25,
        'level_up': 50,
        'challenge_complete': 75,
    }

    @classmethod
    def award_points(cls, user, activity: str, multiplier: float = 1.0, description: str = "") -> dict:
        base_points = cls.POINTS.get(activity, 0)
        earned_points = int(base_points * multiplier)
        if earned_points <= 0:
            return {'success': False, 'reason': 'Unknown activity'}

        user.points += earned_points
        user.save(update_fields=['points'])

        PointsTransaction.objects.create(
            user=user,
            activity=activity,
            points=earned_points,
            multiplier=multiplier,
            description=description or activity,
        )

        new_level = cls.check_level_up(user)

        return {
            'success': True,
            'points_earned': earned_points,
            'total_points': user.points,
            'new_level': new_level,
        }

    @classmethod
    def check_level_up(cls, user) -> dict | None:
        total_points = PointsTransaction.objects.filter(user=user).aggregate(
            total=Sum('points')
        )['total'] or 0

        next_level = Level.objects.filter(
            points_required__gt=0,
            points_required__lte=total_points,
        ).exclude(
            pk__in=Level.objects.filter(
                points_required__gt=total_points
            ).values_list('pk', flat=True)
        ).order_by('-points_required').first()

        if next_level:
            old_points_required = Level.objects.filter(
                points_required__lt=next_level.points_required
            ).order_by('-points_required').values_list('points_required', flat=True).first() or 0

            current_level = Level.objects.filter(
                points_required__lte=total_points
            ).order_by('-points_required').first()

            if current_level:
                return {
                    'level': current_level.number,
                    'name': current_level.name,
                    'points_required': current_level.points_required,
                }

        return None


class BadgeAwarder:
    @classmethod
    def check_and_award(cls, user, requirement_type: str, current_value: int):
        badges = Badge.objects.filter(
            requirement_type=requirement_type,
            requirement_value__lte=current_value,
            is_active=True,
        )
        awarded = []
        for badge in badges:
            _, created = UserBadge.objects.get_or_create(user=user, badge=badge)
            if created:
                badge.total_earned += 1
                badge.save(update_fields=['total_earned'])
                PointsManager.award_points(user, 'badge_earned')
                if badge.name not in user.badges:
                    user.badges.append(badge.name)
                    user.save(update_fields=['badges'])
                awarded.append(badge)
        return awarded


class StreakTracker:
    @classmethod
    def record_daily_activity(cls, user) -> dict:
        streak, _ = UserStreak.objects.get_or_create(user=user)
        is_new = streak.record_activity()
        return {
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'is_new_activity': is_new,
        }

    @classmethod
    def get_streak(cls, user) -> dict:
        streak, _ = UserStreak.objects.get_or_create(user=user)
        return {
            'current_streak': streak.current_streak,
            'longest_streak': streak.longest_streak,
            'last_activity_date': streak.last_activity_date,
        }


class AchievementManager:
    @classmethod
    def check_and_award(cls, user, requirement_type: str, progress_delta: int = 1):
        achievements = Achievement.objects.filter(
            requirement__type=requirement_type,
            is_active=True,
        )
        awarded = []
        for ach in achievements:
            user_ach, created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=ach,
                defaults={'target': ach.requirement.get('count', 1)},
            )
            if not user_ach.completed:
                user_ach.progress += progress_delta
                if user_ach.progress >= user_ach.target:
                    user_ach.completed = True
                    user_ach.completed_at = timezone.now()
                    PointsManager.award_points(user, 'lesson_created', description=ach.name)
                    if ach.badge_reward:
                        BadgeAwarder.check_and_award(user, ach.badge_reward.requirement_type, 1)
                    awarded.append(ach)
                user_ach.save()
        return awarded


class ChallengeManager:
    @classmethod
    def get_active_challenges(cls):
        now = timezone.now()
        return Challenge.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )

    @classmethod
    def join_challenge(cls, user, challenge_id: int) -> dict:
        challenge = Challenge.objects.get(pk=challenge_id, is_active=True)
        participant, created = ChallengeParticipant.objects.get_or_create(
            challenge=challenge,
            user=user,
            defaults={'target': challenge.requirement.get('count', 1)},
        )
        return {'success': created, 'participant': participant}

    @classmethod
    def update_progress(cls, user, requirement_type: str, progress_delta: int = 1):
        now = timezone.now()
        challenges = Challenge.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
            requirement__type=requirement_type,
        )
        completed = []
        for challenge in challenges:
            participant, _ = ChallengeParticipant.objects.get_or_create(
                challenge=challenge,
                user=user,
                defaults={'target': challenge.requirement.get('count', 1)},
            )
            if not participant.completed:
                participant.progress += progress_delta
                if participant.progress >= participant.target:
                    participant.completed = True
                    participant.completed_at = timezone.now()
                    PointsManager.award_points(user, 'challenge_complete')
                    if challenge.badge_reward:
                        BadgeAwarder.check_and_award(user, challenge.badge_reward.requirement_type, 1)
                    completed.append(challenge)
                participant.save()
        return completed


class LeaderboardManager:
    @classmethod
    def update_leaderboard(cls, period: str, category: str):
        entries = []

        if category == 'points':
            entries = cls._get_points_entries(period)
        elif category == 'lessons':
            entries = cls._get_lessons_entries(period)
        elif category == 'streak':
            entries = cls._get_streak_entries()
        elif category == 'badges':
            entries = cls._get_badges_entries()

        entries.sort(key=lambda x: x['score'], reverse=True)
        for i, entry in enumerate(entries):
            entry['rank'] = i + 1

        board, _ = Leaderboard.objects.update_or_create(
            period=period,
            category=category,
            defaults={'entries': entries[:100]},
        )
        return board

    @classmethod
    def _get_points_entries(cls, period: str) -> list:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.all().order_by('-points')[:100]
        return [
            {
                'user_id': u.id,
                'name': u.translations.get('ar', {}).get('name', u.email),
                'score': u.points,
            }
            for u in users
        ]

    @classmethod
    def _get_lessons_entries(cls, period: str) -> list:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.all().order_by('-lessons_created_count')[:100]
        return [
            {
                'user_id': u.id,
                'name': u.translations.get('ar', {}).get('name', u.email),
                'score': u.lessons_created_count,
            }
            for u in users
        ]

    @classmethod
    def _get_streak_entries(cls) -> list:
        streaks = UserStreak.objects.all().order_by('-current_streak')[:100]
        return [
            {
                'user_id': s.user_id,
                'name': s.user.translations.get('ar', {}).get('name', s.user.email),
                'score': s.current_streak,
            }
            for s in streaks
        ]

    @classmethod
    def _get_badges_entries(cls) -> list:
        from django.db.models import Count
        from django.contrib.auth import get_user_model
        User = get_user_model()
        users = User.objects.annotate(
            badge_count=Count('user_badges')
        ).order_by('-badge_count')[:100]
        return [
            {
                'user_id': u.id,
                'name': u.translations.get('ar', {}).get('name', u.email),
                'score': u.badge_count,
            }
            for u in users
        ]

    @classmethod
    def get_user_rank(cls, user_id: int, period: str, category: str) -> dict:
        board = Leaderboard.objects.filter(period=period, category=category).first()
        if not board:
            return {'rank': None, 'score': 0, 'total': 0}
        for entry in board.entries:
            if entry['user_id'] == user_id:
                return {
                    'rank': entry.get('rank'),
                    'score': entry.get('score', 0),
                    'total': len(board.entries),
                }
        return {'rank': None, 'score': 0, 'total': len(board.entries)}

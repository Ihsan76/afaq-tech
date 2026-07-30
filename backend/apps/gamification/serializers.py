from rest_framework import serializers
from .models import (
    Badge, UserBadge, Achievement, UserAchievement,
    Challenge, ChallengeParticipant, UserStreak, Level,
    PointsTransaction, Leaderboard, BadgeCategory,
)


class BadgeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeCategory
        fields = '__all__'


class BadgeSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Badge
        fields = '__all__'

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer()

    class Meta:
        model = UserBadge
        fields = ['id', 'badge', 'earned_at', 'seen']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer()
    percentage = serializers.ReadOnlyField()

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'progress', 'target', 'percentage', 'completed', 'completed_at']


class ChallengeSerializer(serializers.ModelSerializer):
    participants_count = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()

    class Meta:
        model = Challenge
        fields = '__all__'


class ChallengeParticipantSerializer(serializers.ModelSerializer):
    challenge = ChallengeSerializer()
    percentage = serializers.ReadOnlyField()

    class Meta:
        model = ChallengeParticipant
        fields = ['id', 'challenge', 'progress', 'target', 'percentage', 'completed', 'completed_at', 'rank', 'joined_at']


class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = ['current_streak', 'longest_streak', 'last_activity_date', 'streak_rewards_claimed']


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = '__all__'


class PointsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointsTransaction
        fields = '__all__'


class LeaderboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Leaderboard
        fields = ['period', 'category', 'entries', 'updated_at']

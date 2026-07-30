from django.contrib import admin
from .models import (
    BadgeCategory, Badge, UserBadge, Achievement, UserAchievement,
    Challenge, ChallengeParticipant, UserStreak, Level,
    PointsTransaction, Leaderboard,
)


@admin.register(BadgeCategory)
class BadgeCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_en', 'color']
    search_fields = ['name', 'name_en']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_en', 'rarity', 'category', 'is_active', 'total_earned']
    list_filter = ['rarity', 'is_active', 'category']
    search_fields = ['name', 'name_en']
    readonly_fields = ['total_earned']


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at', 'seen']
    list_filter = ['seen']
    search_fields = ['user__email', 'badge__name']
    readonly_fields = ['earned_at']


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'is_active', 'is_secret', 'points_reward', 'total_earned']
    list_filter = ['type', 'is_active', 'is_secret']


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'progress', 'target', 'completed', 'completed_at']
    list_filter = ['completed']


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['name', 'duration', 'is_active', 'start_date', 'end_date', 'points_reward']
    list_filter = ['duration', 'is_active']


@admin.register(ChallengeParticipant)
class ChallengeParticipantAdmin(admin.ModelAdmin):
    list_display = ['challenge', 'user', 'progress', 'target', 'completed', 'completed_at']
    list_filter = ['completed']


@admin.register(UserStreak)
class UserStreakAdmin(admin.ModelAdmin):
    list_display = ['user', 'current_streak', 'longest_streak', 'last_activity_date']


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'points_required', 'color']
    list_editable = ['points_required']


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity', 'points', 'multiplier', 'created_at']
    list_filter = ['activity']
    readonly_fields = ['created_at']


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['period', 'category', 'updated_at']
    list_filter = ['period', 'category']
    readonly_fields = ['updated_at']

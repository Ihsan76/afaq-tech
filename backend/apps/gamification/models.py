from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class BadgeCategory(models.Model):
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#3B82F6')

    class Meta:
        verbose_name = _('Badge Category')
        verbose_name_plural = _('Badge Categories')

    def __str__(self):
        return self.name


class Badge(models.Model):
    class Rarity(models.TextChoices):
        COMMON = 'common', _('Common')
        UNCOMMON = 'uncommon', _('Uncommon')
        RARE = 'rare', _('Rare')
        EPIC = 'epic', _('Epic')
        LEGENDARY = 'legendary', _('Legendary')

    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    description_en = models.TextField(blank=True)
    category = models.ForeignKey(BadgeCategory, on_delete=models.CASCADE, null=True, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    image = models.URLField(blank=True)
    rarity = models.CharField(max_length=15, choices=Rarity.choices, default=Rarity.COMMON)
    points = models.IntegerField(default=0)
    requirement_type = models.CharField(max_length=50, blank=True)
    requirement_value = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    is_hidden = models.BooleanField(default=False)
    total_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Badge')
        verbose_name_plural = _('Badges')
        ordering = ['rarity', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_rarity_display()})"


class UserBadge(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('User Badge')
        verbose_name_plural = _('User Badges')
        unique_together = ['user', 'badge']

    def __str__(self):
        return f"{self.user} - {self.badge.name}"


class Achievement(models.Model):
    class Type(models.TextChoices):
        SINGLE = 'single', _('Single')
        PROGRESS = 'progress', _('Progress')
        SECRET = 'secret', _('Secret')

    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    description_en = models.TextField(blank=True)
    type = models.CharField(max_length=15, choices=Type.choices, default=Type.SINGLE)
    requirement = models.JSONField(default=dict, blank=True)
    points_reward = models.IntegerField(default=0)
    badge_reward = models.ForeignKey(Badge, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    is_secret = models.BooleanField(default=False)
    total_earned = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Achievement')
        verbose_name_plural = _('Achievements')
        ordering = ['name']

    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    target = models.IntegerField(default=1)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('User Achievement')
        verbose_name_plural = _('User Achievements')
        unique_together = ['user', 'achievement']

    @property
    def percentage(self) -> float:
        if self.target == 0:
            return 0
        return (self.progress / self.target) * 100

    def __str__(self):
        return f"{self.user} - {self.achievement.name} ({self.percentage:.0f}%)"


class Challenge(models.Model):
    class Duration(models.TextChoices):
        DAILY = 'daily', _('Daily')
        WEEKLY = 'weekly', _('Weekly')
        MONTHLY = 'monthly', _('Monthly')
        SPECIAL = 'special', _('Special')

    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    description_en = models.TextField(blank=True)
    duration = models.CharField(max_length=15, choices=Duration.choices)
    requirement = models.JSONField(default=dict, blank=True)
    points_reward = models.IntegerField(default=0)
    badge_reward = models.ForeignKey(Badge, null=True, blank=True, on_delete=models.SET_NULL)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    max_participants = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Challenge')
        verbose_name_plural = _('Challenges')
        ordering = ['-start_date']

    @property
    def is_ongoing(self) -> bool:
        now = timezone.now()
        return self.start_date <= now <= self.end_date

    @property
    def participants_count(self) -> int:
        return self.participants.count()

    def __str__(self):
        return self.name


class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='challenge_participations')
    progress = models.IntegerField(default=0)
    target = models.IntegerField(default=1)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    rank = models.IntegerField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Challenge Participant')
        verbose_name_plural = _('Challenge Participants')
        unique_together = ['challenge', 'user']

    @property
    def percentage(self) -> float:
        if self.target == 0:
            return 0
        return (self.progress / self.target) * 100

    def __str__(self):
        return f"{self.user} - {self.challenge.name}"


class UserStreak(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    streak_rewards_claimed = models.JSONField(default=list, blank=True)

    class Meta:
        verbose_name = _('User Streak')
        verbose_name_plural = _('User Streaks')

    def record_activity(self):
        today = timezone.now().date()
        if self.last_activity_date == today:
            return False
        if self.last_activity_date == today - timedelta(days=1):
            self.current_streak += 1
        else:
            self.current_streak = 1
        self.last_activity_date = today
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        self.save()
        self.check_streak_rewards()
        return True

    def check_streak_rewards(self):
        from .services import PointsManager
        streak_milestones = [3, 7, 14, 30, 60, 90, 180, 365]
        for milestone in streak_milestones:
            if self.current_streak >= milestone and milestone not in self.streak_rewards_claimed:
                PointsManager.award_points(self.user, f'consecutive_days_{milestone}')
                self.streak_rewards_claimed.append(milestone)
                self.save(update_fields=['streak_rewards_claimed'])

    def __str__(self):
        return f"{self.user} - {self.current_streak}d"


class Level(models.Model):
    number = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100, blank=True)
    points_required = models.IntegerField()
    badge_reward = models.ForeignKey(Badge, null=True, blank=True, on_delete=models.SET_NULL)
    benefits = models.JSONField(default=list, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')

    class Meta:
        verbose_name = _('Level')
        verbose_name_plural = _('Levels')
        ordering = ['number']

    def __str__(self):
        return f"Level {self.number}: {self.name}"


class PointsTransaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='points_transactions')
    activity = models.CharField(max_length=50)
    points = models.IntegerField()
    multiplier = models.FloatField(default=1.0)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Points Transaction')
        verbose_name_plural = _('Points Transactions')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} - {self.activity} ({self.points})"


class Leaderboard(models.Model):
    class Period(models.TextChoices):
        DAILY = 'daily', _('Daily')
        WEEKLY = 'weekly', _('Weekly')
        MONTHLY = 'monthly', _('Monthly')
        ALL_TIME = 'all_time', _('All Time')

    class Category(models.TextChoices):
        POINTS = 'points', _('Points')
        LESSONS = 'lessons', _('Lessons Created')
        STREAK = 'streak', _('Longest Streak')
        BADGES = 'badges', _('Badges')

    period = models.CharField(max_length=15, choices=Period.choices)
    category = models.CharField(max_length=15, choices=Category.choices)
    entries = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Leaderboard')
        verbose_name_plural = _('Leaderboards')
        unique_together = ['period', 'category']

    def __str__(self):
        return f"{self.get_period_display()} - {self.get_category_display()}"

from django.urls import path

from . import views

urlpatterns = [
    # Points
    path('points/', views.points_summary, name='gamification-points'),
    path('points/history/', views.points_history, name='gamification-points-history'),

    # Badges
    path('badges/', views.BadgeListView.as_view(), name='gamification-badges'),
    path('badges/my/', views.my_badges, name='gamification-badges-my'),
    path('badges/<int:pk>/seen/', views.mark_badge_seen, name='gamification-badge-seen'),

    # Achievements
    path('achievements/', views.AchievementListView.as_view(), name='gamification-achievements'),
    path('achievements/my/', views.my_achievements, name='gamification-achievements-my'),

    # Challenges
    path('challenges/active/', views.active_challenges, name='gamification-challenges-active'),
    path('challenges/<int:pk>/join/', views.join_challenge, name='gamification-challenge-join'),
    path('challenges/my/', views.my_challenges, name='gamification-challenges-my'),

    # Streaks
    path('streak/', views.streak_status, name='gamification-streak'),
    path('streak/check-in/', views.streak_checkin, name='gamification-streak-checkin'),

    # Leaderboard
    path('leaderboard/', views.leaderboard_view, name='gamification-leaderboard'),
    path('leaderboard/my-rank/', views.my_rank, name='gamification-leaderboard-my-rank'),

    # Levels
    path('levels/', views.LevelListView.as_view(), name='gamification-levels'),
    path('levels/my/', views.my_level, name='gamification-levels-my'),
]

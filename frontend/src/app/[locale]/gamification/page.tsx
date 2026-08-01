"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface PointsSummary {
  current: number;
  total_earned: number;
  today: number;
}

interface PointsTransaction {
  id: number;
  activity: string;
  points: number;
  multiplier: number;
  description: string;
  created_at: string;
}

interface Badge {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  category: number | null;
  category_name: string;
  icon: string;
  image: string;
  rarity: string;
  points: number;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
  is_hidden: boolean;
}

interface UserBadge {
  id: number;
  badge: Badge;
  earned_at: string;
  seen: boolean;
}

interface Achievement {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  type: string;
  requirement: Record<string, unknown>;
  points_reward: number;
  badge_reward: number | null;
  is_active: boolean;
  is_secret: boolean;
}

interface UserAchievement {
  id: number;
  achievement: Achievement;
  progress: number;
  target: number;
  percentage: number;
  completed: boolean;
  completed_at: string | null;
}

interface Challenge {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  duration: string;
  requirement: Record<string, unknown>;
  points_reward: number;
  badge_reward: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  max_participants: number | null;
  participants_count: number;
  is_ongoing: boolean;
}

interface ChallengeParticipation {
  id: number;
  challenge: Challenge;
  progress: number;
  target: number;
  percentage: number;
  completed: boolean;
  completed_at: string | null;
  rank: number | null;
  joined_at: string;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface LevelData {
  current_level: { id: number; number: number; name: string; name_en: string; points_required: number; icon: string; color: string } | null;
  next_level: { id: number; number: number; name: string; name_en: string; points_required: number; icon: string; color: string } | null;
  total_points: number;
  progress: number;
}

interface LeaderboardEntry {
  user_id: number;
  name: string;
  score: number;
  rank: number;
}

interface LeaderboardData {
  period: string;
  category: string;
  entries: LeaderboardEntry[];
  updated_at: string;
}

interface MyRankData {
  rank: number | null;
  score: number;
  total: number;
}

type Tab = "leaderboard" | "badges" | "achievements" | "challenges" | "streak" | "points";

const TABS: { key: Tab; icon: string }[] = [
  { key: "leaderboard", icon: "🏆" },
  { key: "badges", icon: "🎖️" },
  { key: "achievements", icon: "⭐" },
  { key: "challenges", icon: "🔥" },
  { key: "streak", icon: "📅" },
  { key: "points", icon: "💰" },
];

const PERIODS = ["daily", "weekly", "monthly", "allTime"] as const;
const CATEGORIES = ["points", "lessons", "streak", "badges"] as const;

const RARITY_COLORS: Record<string, string> = {
  common: "#6B7280",
  uncommon: "#22C55E",
  rare: "#3B82F6",
  epic: "#A855F7",
  legendary: "#F59E0B",
};

const ACTIVITY_LABELS: Record<string, { ar: string; en: string }> = {
  lesson_complete: { ar: "إكمال درس", en: "Lesson Completed" },
  lesson_created: { ar: "إنشاء خطة درس", en: "Lesson Plan Created" },
  quiz_perfect: { ar: "اختبار مثالي", en: "Perfect Quiz Score" },
  quiz_pass: { ar: "اجتياز اختبار", en: "Quiz Passed" },
  course_complete: { ar: "إكمال دورة", en: "Course Completed" },
  course_review: { ar: "مراجعة دورة", en: "Course Reviewed" },
  daily_login: { ar: "تسجيل دخول يومي", en: "Daily Login" },
  consecutive_days_3: { ar: "3 أيام متتالية", en: "3-Day Streak" },
  consecutive_days_7: { ar: "7 أيام متتالية", en: "7-Day Streak" },
  consecutive_days_30: { ar: "30 يوماً متتالية", en: "30-Day Streak" },
  blog_post: { ar: "كتابة مقال", en: "Blog Post" },
  blog_comment: { ar: "تعليق على مقال", en: "Blog Comment" },
  helpful_answer: { ar: "إجابة مفيدة", en: "Helpful Answer" },
  product_upload: { ar: "رفع منتج", en: "Product Uploaded" },
  first_sale: { ar: "أول عملية بيع", en: "First Sale" },
  sale: { ar: "عملية بيع", en: "Sale Made" },
  badge_earned: { ar: "الحصول على شارة", en: "Badge Earned" },
  level_up: { ar: "رفع المستوى", en: "Level Up" },
  challenge_complete: { ar: "إكمال تحدٍ", en: "Challenge Completed" },
};

export default function GamificationPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user, isLoading: authLoading, loadUser } = useAuthStore();
  const loadedRef = useRef(false);

  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");
  const [points, setPoints] = useState<PointsSummary | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [myBadges, setMyBadges] = useState<UserBadge[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [myAchievements, setMyAchievements] = useState<UserAchievement[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [myChallenges, setMyChallenges] = useState<ChallengeParticipation[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [myRank, setMyRank] = useState<MyRankData | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("weekly");
  const [leaderboardCategory, setLeaderboardCategory] = useState("points");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [badgeFilter, setBadgeFilter] = useState<"all" | "earned" | "notEarned">("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");

  useEffect(() => {
    if (!loadedRef.current) { loadedRef.current = true; loadUser(); }
  }, [loadUser]);

  useEffect(() => {
    if (loadedRef.current && !authLoading && !user) router.push(`/${locale}/login`);
  }, [user, authLoading, router, locale]);

  const fetchData = useCallback(async (tab: Tab) => {
    setLoading((prev) => ({ ...prev, [tab]: true }));
    try {
      switch (tab) {
        case "leaderboard": {
          const [boardRes, rankRes] = await Promise.all([
            api.get(`/gamification/leaderboard/?period=${leaderboardPeriod}&category=${leaderboardCategory}`),
            api.get(`/gamification/leaderboard/my-rank/?period=${leaderboardPeriod}&category=${leaderboardCategory}`).catch(() => null),
          ]);
          setLeaderboard(boardRes.data);
          if (rankRes) setMyRank(rankRes.data);
          break;
        }
        case "badges": {
          const [allBadges, userBadges] = await Promise.all([
            api.get("/gamification/badges/"),
            api.get("/gamification/badges/my/"),
          ]);
          setBadges(allBadges.data);
          setMyBadges(userBadges.data);
          break;
        }
        case "achievements": {
          const [allAch, userAch] = await Promise.all([
            api.get("/gamification/achievements/"),
            api.get("/gamification/achievements/my/"),
          ]);
          setAchievements(allAch.data);
          setMyAchievements(userAch.data);
          break;
        }
        case "challenges": {
          const [active, my] = await Promise.all([
            api.get("/gamification/challenges/active/"),
            api.get("/gamification/challenges/my/").catch(() => ({ data: [] })),
          ]);
          setActiveChallenges(active.data);
          setMyChallenges(my.data);
          break;
        }
        case "streak": {
          const [streakRes, pointsRes, levelRes] = await Promise.all([
            api.get("/gamification/streak/"),
            api.get("/gamification/points/"),
            api.get("/gamification/levels/my/"),
          ]);
          setStreak(streakRes.data);
          setPoints(pointsRes.data);
          setLevel(levelRes.data);
          break;
        }
        case "points": {
          const [transactionsRes, pointsRes, levelRes] = await Promise.all([
            api.get("/gamification/points/history/"),
            api.get("/gamification/points/"),
            api.get("/gamification/levels/my/"),
          ]);
          setTransactions(transactionsRes.data);
          setPoints(pointsRes.data);
          setLevel(levelRes.data);
          break;
        }
      }
    } catch {
      // silent
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, [leaderboardPeriod, leaderboardCategory]);

  useEffect(() => {
    if (!user) return;
    fetchData(activeTab);
  }, [activeTab, user, fetchData]);

  const handleCheckIn = async () => {
    try {
      const res = await api.post("/gamification/streak/check-in/");
      setStreak(res.data);
    } catch {
      // silent
    }
  };

  const handleJoinChallenge = async (id: number) => {
    try {
      await api.post(`/gamification/challenges/${id}/join/`);
      fetchData("challenges");
    } catch {
      // silent
    }
  };

  const getActivityLabel = (activity: string): string => {
    const label = ACTIVITY_LABELS[activity];
    if (!label) return activity;
    return locale === "ar" ? label.ar : label.en;
  };

  const earnedBadgeIds = new Set(myBadges.map((b) => b.badge.id));
  const completedAchIds = new Set(myAchievements.filter((a) => a.completed).map((a) => a.achievement.id));
  const completedChallengeIds = new Set(myChallenges.filter((c) => c.completed).map((c) => c.challenge.id));
  const joinedChallengeIds = new Set(myChallenges.map((c) => c.challenge.id));

  const displayName = user?.name_ar || user?.name_en || user?.email || "";

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-lg">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
        <FadeIn direction="down">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text)" }}>
                🎮 {t("gamification.title")}
              </h1>
              <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("gamification.description")}
              </p>
            </div>
            {points && (
              <div className="flex gap-3">
                <div className="px-4 py-2 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.current")}</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{points.current.toLocaleString()}</p>
                </div>
                {level?.current_level && (
                  <div className="px-4 py-2 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.level")}</p>
                    <p className="text-xl font-bold" style={{ color: "var(--color-secondary)" }}>
                      {level.current_level.icon || "⭐"} {level.current_level.number}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </FadeIn>

        <FadeIn direction="up">
          <div className="flex overflow-x-auto gap-1 mb-6 pb-2" style={{ scrollbarWidth: "none" }}>
            {TABS.map(({ key, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: activeTab === key ? "var(--color-primary-light)" : "var(--color-surface)",
                  color: activeTab === key ? "var(--color-primary)" : "var(--color-text-secondary)",
                  border: activeTab === key ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
                }}
              >
                <span>{icon}</span>
                {t(`gamification.tabs.${key}`)}
              </button>
            ))}
          </div>
        </FadeIn>

        {loading[activeTab] && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t("common.loading")}</span>
            </div>
          </div>
        )}

        {!loading[activeTab] && (
          <FadeIn direction="up" key={activeTab}>
            {activeTab === "leaderboard" && renderLeaderboard()}
            {activeTab === "badges" && renderBadges()}
            {activeTab === "achievements" && renderAchievements()}
            {activeTab === "challenges" && renderChallenges()}
            {activeTab === "streak" && renderStreak()}
            {activeTab === "points" && renderPointsHistory()}
          </FadeIn>
        )}
      </div>
    </div>
  );

  function renderLeaderboard() {
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setLeaderboardPeriod(p === "allTime" ? "all_time" : p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: leaderboardPeriod === (p === "allTime" ? "all_time" : p) ? "var(--color-primary-light)" : "transparent",
                  color: leaderboardPeriod === (p === "allTime" ? "all_time" : p) ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {t(`gamification.leaderboard.period.${p}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setLeaderboardCategory(c)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: leaderboardCategory === c ? "var(--color-primary-light)" : "transparent",
                  color: leaderboardCategory === c ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {t(`gamification.leaderboard.category.${c}`)}
              </button>
            ))}
          </div>
        </div>

        {myRank && (
          <div className="p-4 rounded-2xl mb-4 flex items-center justify-between" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("gamification.leaderboard.yourRank")}</p>
              <p className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                {myRank.rank ? `#${myRank.rank}` : "—"}
              </p>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {myRank.score} {t("gamification.leaderboard.score")} &middot; {t("gamification.leaderboard.outOf")} {myRank.total}
            </p>
          </div>
        )}

        {(!leaderboard || leaderboard.entries.length === 0) ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <p className="text-4xl mb-3">🏆</p>
            <p>{t("gamification.leaderboard.noData")}</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                    <th className="px-4 py-3 text-start font-semibold" style={{ color: "var(--color-text-muted)", width: "60px" }}>#</th>
                    <th className="px-4 py-3 text-start font-semibold" style={{ color: "var(--color-text-muted)" }}>{t("gamification.leaderboard.user")}</th>
                    <th className="px-4 py-3 text-end font-semibold" style={{ color: "var(--color-text-muted)" }}>{t("gamification.leaderboard.score")}</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry) => (
                    <tr
                      key={entry.user_id}
                      className="transition-colors hover:opacity-80"
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        background: entry.user_id === user?.id ? "var(--color-primary-light)" : "transparent",
                      }}
                    >
                      <td className="px-4 py-3 font-bold" style={{ color: entry.rank <= 3 ? "var(--color-secondary)" : "var(--color-text-muted)" }}>
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                            {(entry.name || "?")[0]?.toUpperCase()}
                          </div>
                          <span className="truncate max-w-[200px]">{entry.name}</span>
                          {entry.user_id === user?.id && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{t("common.you")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end font-semibold" style={{ color: "var(--color-primary)" }}>{entry.score.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderBadges() {
    const filteredBadges = badges.filter((b) => {
      if (rarityFilter !== "all" && b.rarity !== rarityFilter) return false;
      if (badgeFilter === "earned") return earnedBadgeIds.has(b.id);
      if (badgeFilter === "notEarned") return !earnedBadgeIds.has(b.id);
      return true;
    });

    const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
    const sortedBadges = [...filteredBadges].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            {(["all", "earned", "notEarned"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setBadgeFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: badgeFilter === f ? "var(--color-primary-light)" : "transparent",
                  color: badgeFilter === f ? "var(--color-primary)" : "var(--color-text-secondary)",
                }}
              >
                {t(`gamification.badges.${f}`)}
              </button>
            ))}
          </div>
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setRarityFilter("all")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: rarityFilter === "all" ? "var(--color-primary-light)" : "transparent",
                color: rarityFilter === "all" ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              {t("gamification.badges.all")}
            </button>
            {(["common", "uncommon", "rare", "epic", "legendary"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: rarityFilter === r ? "var(--color-primary-light)" : "transparent",
                  color: rarityFilter === r ? RARITY_COLORS[r] : "var(--color-text-secondary)",
                  border: rarityFilter === r ? `1px solid ${RARITY_COLORS[r]}40` : "none",
                }}
              >
                {t(`gamification.badges.rarity.${r}`)}
              </button>
            ))}
          </div>
        </div>

        {sortedBadges.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <p className="text-4xl mb-3">🎖️</p>
            <p>{t("gamification.badges.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedBadges.map((badge) => {
              const earned = myBadges.find((b) => b.badge.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className="p-4 rounded-2xl transition-all duration-200"
                  style={{
                    background: earned ? "var(--color-surface)" : "var(--color-surface)",
                    border: earned
                      ? `1px solid ${RARITY_COLORS[badge.rarity]}40`
                      : "1px solid var(--color-border)",
                    opacity: earned ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{
                        background: earned ? `${RARITY_COLORS[badge.rarity]}20` : "var(--color-muted)",
                        border: `1px solid ${RARITY_COLORS[badge.rarity]}30`,
                      }}
                    >
                      {badge.icon || "🎖️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>
                          {locale === "ar" && badge.name ? badge.name : badge.name_en || badge.name}
                        </h3>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${RARITY_COLORS[badge.rarity]}20`,
                            color: RARITY_COLORS[badge.rarity],
                          }}
                        >
                          {t(`gamification.badges.rarity.${badge.rarity}`)}
                        </span>
                      </div>
                      <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                        {locale === "ar" && badge.description ? badge.description : badge.description_en || badge.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {badge.points > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                            +{badge.points} {t("gamification.badges.points_reward")}
                          </span>
                        )}
                        {earned && (
                          <span className="text-xs" style={{ color: "var(--color-success)" }}>
                            ✅ {t("gamification.badges.earned")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  function renderAchievements() {
    const allUserAch = achievements.map((ach) => {
      const userAch = myAchievements.find((ua) => ua.achievement.id === ach.id);
      return {
        achievement: ach,
        progress: userAch?.progress || 0,
        target: userAch?.target || ach.requirement?.count || 1,
        completed: userAch?.completed || false,
        percentage: userAch?.percentage || 0,
      };
    });

    const completed = allUserAch.filter((a) => a.completed);
    const inProgress = allUserAch.filter((a) => !a.completed && a.progress > 0);
    const locked = allUserAch.filter((a) => !a.completed && a.progress === 0);

    const sections = [
      { label: t("gamification.achievements.completed"), items: completed, icon: "✅" },
      { label: t("gamification.achievements.inProgress"), items: inProgress, icon: "🔄" },
      { label: t("gamification.achievements.locked"), items: locked, icon: "🔒" },
    ];

    return (
      <div>
        {sections.map((section) =>
          section.items.length > 0 ? (
            <div key={section.label} className="mb-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
                {section.icon} {section.label} ({section.items.length})
              </h3>
              <div className="space-y-2">
                {section.items.map(({ achievement, progress, target, completed, percentage }) => (
                  <div
                    key={achievement.id}
                    className="p-4 rounded-2xl"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: completed ? "var(--color-success-light)" : "var(--color-muted)" }}
                      >
                        {achievement.type === "secret" ? "🤫" : completed ? "✅" : "⭐"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm" style={{ color: "var(--color-text)" }}>
                          {locale === "ar" && achievement.name ? achievement.name : achievement.name_en || achievement.name}
                        </h4>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                          {locale === "ar" && achievement.description ? achievement.description : achievement.description_en || achievement.description}
                        </p>
                        {!completed && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: "var(--color-text-muted)" }}>{t("gamification.achievements.progress")}</span>
                              <span style={{ color: "var(--color-primary)" }}>{`${progress} / ${target}`}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-muted)" }}>
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(percentage, 100)}%`, background: "var(--color-primary)" }}
                              />
                            </div>
                          </div>
                        )}
                        {completed && (
                          <p className="text-xs mt-1" style={{ color: "var(--color-success)" }}>
                            ✅ {t("gamification.achievements.completed")}
                          </p>
                        )}
                        {achievement.points_reward > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                            +{achievement.points_reward} {t("gamification.challenges.points_reward")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )}

        {allUserAch.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <p className="text-4xl mb-3">⭐</p>
            <p>{t("gamification.achievements.empty")}</p>
          </div>
        )}
      </div>
    );
  }

  function renderChallenges() {
    const active = activeChallenges.filter((c) => !completedChallengeIds.has(c.id));

    return (
      <div>
        {active.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
              🔥 {t("gamification.challenges.active")} ({active.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.map((challenge) => {
                const joined = joinedChallengeIds.has(challenge.id);
                const participation = myChallenges.find((c) => c.challenge.id === challenge.id);
                return (
                  <div
                    key={challenge.id}
                    className="p-4 rounded-2xl"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                          {locale === "ar" && challenge.name ? challenge.name : challenge.name_en || challenge.name}
                        </h4>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                          {locale === "ar" && challenge.description ? challenge.description : challenge.description_en || challenge.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-muted)", color: "var(--color-text-muted)" }}>
                            {t(`gamification.challenges.${challenge.duration}`)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                            +{challenge.points_reward} {t("gamification.challenges.points_reward")}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                            👥 {challenge.participants_count}
                          </span>
                        </div>
                        {joined && participation && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: "var(--color-text-muted)" }}>{t("gamification.challenges.progress")}</span>
                              <span style={{ color: "var(--color-primary)" }}>{`${participation.progress} / ${participation.target}`}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full" style={{ background: "var(--color-muted)" }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${Math.min(participation.percentage, 100)}%`, background: "var(--color-primary)" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        disabled={joined}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                        style={{
                          background: joined ? "var(--color-muted)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                          color: joined ? "var(--color-text-muted)" : "white",
                        }}
                      >
                        {joined ? t("gamification.challenges.joined") : t("gamification.challenges.join")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {myChallenges.filter((c) => !c.completed).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>
              📋 {t("gamification.challenges.my")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myChallenges.filter((c) => !c.completed).map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                        {locale === "ar" && p.challenge.name ? p.challenge.name : p.challenge.name_en || p.challenge.name}
                      </h4>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: "var(--color-text-muted)" }}>{t("gamification.challenges.progress")}</span>
                          <span style={{ color: "var(--color-primary)" }}>{`${p.progress} / ${p.target}`}</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: "var(--color-muted)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(p.percentage, 100)}%`, background: "var(--color-primary)" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {active.length === 0 && myChallenges.filter((c) => !c.completed).length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <p className="text-4xl mb-3">🔥</p>
            <p>{t("gamification.challenges.empty")}</p>
          </div>
        )}
      </div>
    );
  }

  function renderStreak() {
    return (
      <div>
        {level && (
          <div className="p-6 rounded-2xl mb-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.level")}</h3>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${level.current_level?.color || "var(--color-primary)"}20`, border: `1px solid ${level.current_level?.color || "var(--color-primary)"}40` }}
              >
                {level.current_level?.icon || "⭐"}
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                  {t("gamification.points.level")} {level.current_level?.number || 0} &mdash; {locale === "ar" && level.current_level?.name ? level.current_level.name : level.current_level?.name_en || level.current_level?.name || ""}
                </p>
                {level.next_level && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--color-text-muted)" }}>
                        {level.total_points.toLocaleString()} / {level.next_level.points_required.toLocaleString()}
                      </span>
                      <span style={{ color: "var(--color-primary)" }}>{Math.round(level.progress)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "var(--color-muted)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(level.progress, 100)}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>{streak?.current_streak || 0}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.streak.current")}</p>
          </div>
          <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-secondary)" }}>{streak?.longest_streak || 0}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.streak.longest")}</p>
          </div>
          <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-success)" }}>{points?.today || 0}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.today")}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <p className="text-5xl mb-3">🔥</p>
          <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            {streak?.current_streak || 0} {t("gamification.streak.days")}
          </p>
          <button
            onClick={handleCheckIn}
            disabled={streak?.last_activity_date === new Date().toISOString().slice(0, 10)}
            className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: streak?.last_activity_date === new Date().toISOString().slice(0, 10)
                ? "var(--color-muted)"
                : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              color: streak?.last_activity_date === new Date().toISOString().slice(0, 10)
                ? "var(--color-text-muted)"
                : "white",
            }}
          >
            {streak?.last_activity_date === new Date().toISOString().slice(0, 10)
              ? `✅ ${t("gamification.streak.checkedIn")}`
              : `📅 ${t("gamification.streak.checkIn")}`
            }
          </button>
        </div>
      </div>
    );
  }

  function renderPointsHistory() {
    return (
      <div>
        {points && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>{points.current.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.current")}</p>
            </div>
            <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-secondary)" }}>{points.total_earned.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.total")}</p>
            </div>
            <div className="p-5 rounded-2xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--color-success)" }}>{points.today.toLocaleString()}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.today")}</p>
            </div>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
            <p className="text-4xl mb-3">💰</p>
            <p>{t("gamification.points.empty")}</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                    <th className="px-4 py-3 text-start font-semibold" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.activity")}</th>
                    <th className="px-4 py-3 text-start font-semibold hidden sm:table-cell" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.date")}</th>
                    <th className="px-4 py-3 text-end font-semibold" style={{ color: "var(--color-text-muted)" }}>{t("gamification.points.points")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:opacity-80" style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium" style={{ color: "var(--color-text)" }}>
                            {getActivityLabel(tx.activity)}
                          </p>
                          {tx.description && tx.description !== tx.activity && (
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{tx.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(tx.created_at).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <span className="font-semibold" style={{ color: tx.points > 0 ? "var(--color-success)" : "var(--color-error)" }}>
                          {tx.points > 0 ? "+" : ""}{tx.points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }
}

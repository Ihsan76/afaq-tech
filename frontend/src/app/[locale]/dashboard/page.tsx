"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface LessonPlan {
  id: number;
  title: string;
  status: string;
  is_public: boolean;
  created_at: string;
  subject?: number | null;
  grade?: number | null;
}

interface UserStats {
  points: number;
  badges: string[];
  lessons_created_count: number;
  total_plans: number;
  published_plans: number;
  total_likes: number;
  total_clones: number;
  total_downloads: number;
}

const ROLE_ICONS: Record<string, string> = {
  student: "🎓",
  teacher: "👨‍🏫",
  creator: "✍️",
  admin: "👑",
};

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  basic: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)" },
  pro: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  enterprise: { bg: "#fef3c7", color: "#d97706" },
};

const BADGE_LABELS: Record<string, { label: string; icon: string }> = {
  pro_creator: { label: "منتج محترف", icon: "🏆" },
  early_adopter: { label: "متبنٍ مبكر", icon: "🌟" },
  top_contributor: { label: "مساهم مميز", icon: "💎" },
};

const STAT_CARDS = [
  { key: "total_plans", icon: "📝", label: "إجمالي الخطط" },
  { key: "published_plans", icon: "🌍", label: "الخطط المنشورة" },
  { key: "total_likes", icon: "❤️", label: "الإعجابات" },
  { key: "total_clones", icon: "📋", label: "الاستنساخ" },
  { key: "total_downloads", icon: "⬇️", label: "التحميل" },
] as const;

export default function DashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user, isLoading, loadUser } = useAuthStore();
  const loadedRef = useRef(false);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => { if (!loadedRef.current) { loadedRef.current = true; loadUser(); } }, [loadUser]);
  useEffect(() => { if (loadedRef.current && !isLoading && !user) router.push(`/${locale}/login`); }, [user, isLoading, router, locale]);

  const isAdmin = user?.role === "admin" || user?.is_staff;
  const canCreatePlans = user?.role === "teacher" || user?.role === "creator" || isAdmin;

  // Load lesson plans for teacher/creator/admin
  useEffect(() => {
    if (!user || !canCreatePlans) return;
    setPlansLoading(true);
    api.get("/lesson-plans/")
      .then((r) => {
        const list = r.data.results || r.data || [];
        setPlans(Array.isArray(list) ? list.slice(0, 5) : []);
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, [user, canCreatePlans]);

  // Load course enrollments for all users
  useEffect(() => {
    if (!user) return;
    setEnrollLoading(true);
    api.get("/courses/my/")
      .then((r) => {
        const list = r.data.results || r.data || [];
        setEnrollments(Array.isArray(list) ? list.slice(0, 4) : []);
      })
      .catch(() => {})
      .finally(() => setEnrollLoading(false));
  }, [user]);

  // Load gamification stats
  useEffect(() => {
    if (!user) return;
    setStatsLoading(true);
    api.get("/auth/me/stats/")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [user]);

  if (isLoading && !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span className="text-lg">{t("common.loading")}</span>
      </div>
    </div>
  );

  if (!user) return null;

  const roleKey = `role${(user.role || "student").charAt(0).toUpperCase() + (user.role || "student").slice(1)}` as const;
  const planKey = `plan${(user.subscription_plan || "free").charAt(0).toUpperCase() + (user.subscription_plan || "free").slice(1)}` as const;
  const planColor = PLAN_COLORS[user.subscription_plan || "free"] || PLAN_COLORS.free;
  const userName = (user as any).name || user.name_ar || user.name_en || user.email;
  const isFree = !user.subscription_plan || user.subscription_plan === "free";

  // Role-based action cards
  const actions: { href: string; icon: string; title: string; desc: string; color: string }[] = [];

  if (canCreatePlans) {
    actions.push({
      href: `/${locale}/lesson-plans/new`,
      icon: "🤖",
      title: t("dashboard.createPlan"),
      desc: t("dashboard.createPlanDesc"),
      color: "var(--color-primary-light)",
    });
    actions.push({
      href: `/${locale}/lesson-plans`,
      icon: "📝",
      title: t("dashboard.myPlans"),
      desc: t("dashboard.myPlansDesc"),
      color: "var(--color-success-light)",
    });
    actions.push({
      href: `/${locale}/lesson-plans/marketplace`,
      icon: "🏪",
      title: t("marketplace"),
      desc: t("lessonPlan.marketplaceDesc"),
      color: "var(--color-warning-light)",
    });
  }

  if (user.role === "student") {
    actions.push({
      href: `/${locale}/academy`,
      icon: "🎓",
      title: t("dashboard.browseAcademy"),
      desc: t("dashboard.browseAcademyDesc"),
      color: "var(--color-primary-light)",
    });
    actions.push({
      href: `/${locale}/curriculum`,
      icon: "📚",
      title: t("dashboard.browseCurriculum"),
      desc: t("dashboard.browseCurriculumDesc"),
      color: "var(--color-success-light)",
    });
  }

  actions.push({
    href: `/${locale}/academy/courses`,
    icon: "🎬",
    title: t("courses.title"),
    desc: t("dashboard.myCoursesDesc"),
    color: "var(--color-info-light, #e0f2fe)",
  });

  actions.push({
    href: `/${locale}/ebooks`,
    icon: "📖",
    title: t("dashboard.browseEbooks"),
    desc: t("dashboard.browseEbooksDesc"),
    color: "var(--color-accent-light)",
  });

  if (isAdmin) {
    actions.push({
      href: `/${locale}/admin`,
      icon: "⚙️",
      title: t("dashboard.adminPanel"),
      desc: t("dashboard.adminPanelDesc"),
      color: "var(--color-warning-light)",
    });
  }

  if (["school", "enterprise"].includes(user.subscription_plan || "")) {
    actions.push({
      href: `/${locale}/organization`,
      icon: "🏫",
      title: t("dashboard.manageOrg"),
      desc: t("dashboard.manageOrgDesc"),
      color: "var(--color-info-light, #e0f2fe)",
    });
  }

  actions.push({
    href: `/${locale}/profile`,
    icon: "👤",
    title: t("dashboard.accountSettings"),
    desc: t("dashboard.accountSettingsDesc"),
    color: "var(--color-surface-alt)",
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 p-6 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              userName?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("dashboard.welcome")}, {userName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                {ROLE_ICONS[user.role] || "🎓"} {t(`dashboard.${roleKey}`)}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold" style={{ background: planColor.bg, color: planColor.color }}>
                {t(`dashboard.${planKey}`)}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {t("dashboard.memberSince")} {user.date_joined ? new Date(user.date_joined).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US", { year: "numeric", month: "long" }) : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Gamification Stats */}
        {canCreatePlans && (
          <div className="mb-8">
            {statsLoading ? (
              <div className="text-center py-6" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Points & Badge — special card */}
                <div className="col-span-2 sm:col-span-1 lg:col-span-2 p-4 rounded-3xl flex flex-col justify-center" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "#fff" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <p className="text-2xl font-bold">{stats.points}</p>
                      <p className="text-xs opacity-80">نقطة</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stats.badges.length === 0 ? (
                      <span className="text-xs opacity-60">لا توجد شارات بعد</span>
                    ) : (
                      stats.badges.map((b) => (
                        <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                          {BADGE_LABELS[b]?.icon || "🎖️"} {BADGE_LABELS[b]?.label || b}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {STAT_CARDS.map((card) => (
                  <div key={card.key} className="p-4 rounded-3xl text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="text-2xl mb-1">{card.icon}</div>
                    <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                      {String(stats[card.key as keyof UserStats] ?? 0)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{card.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Quick Actions */}
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("dashboard.quickActions")}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {actions.map((a, idx) => (
            <FadeIn key={a.href} delay={idx * 60} direction="up">
              <Link href={a.href} className="group block p-5 rounded-3xl transition-all duration-300 hover:-translate-y-1" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: a.color }}>
                  <span className="text-2xl">{a.icon}</span>
                </div>
                <h3 className="font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{a.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{a.desc}</p>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* Recent Lesson Plans — teacher/creator/admin */}
        {canCreatePlans && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {t("dashboard.recentPlans")}
              </h2>
              <Link href={`/${locale}/lesson-plans`} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                {t("dashboard.viewAll")} ←
              </Link>
            </div>
            {plansLoading ? (
              <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                {t("dashboard.noRecentPlans")}
              </div>
            ) : (
              <div className="space-y-2">
                {plans.map((plan) => (
                  <Link key={plan.id} href={`/${locale}/lesson-plans/${plan.id}`} className="flex items-center justify-between p-4 rounded-2xl transition-all hover:opacity-90" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">📝</span>
                      <span className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>{plan.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                        background: plan.status === "published" ? "var(--color-success-light)" : "var(--color-surface-alt)",
                        color: plan.status === "published" ? "var(--color-success)" : "var(--color-text-muted)",
                      }}>
                        {plan.status}
                      </span>
                      <span className="text-xs hidden sm:block" style={{ color: "var(--color-text-muted)" }}>
                        {plan.created_at ? new Date(plan.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Courses — all users */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("courses.myCourses")}
            </h2>
            <Link href={`/${locale}/academy/courses`} className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
              {t("courses.browseCourses")} ←
            </Link>
          </div>
          {enrollLoading ? (
            <div className="text-center py-8" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              {t("courses.noMyCourses")}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {enrollments.map((enr: any) => {
                const courseTitle = enr.course?.title?.[locale] || enr.course?.title?.en || enr.course?.title?.ar || "";
                return (
                  <Link key={enr.id} href={`/${locale}/academy/courses/${enr.course?.slug}/learn`} className="flex gap-4 p-4 rounded-3xl transition-all hover:-translate-y-1" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    {enr.course?.thumbnail && (
                      <img src={enr.course.thumbnail} alt="" className="w-24 h-16 rounded-xl object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate mb-2" style={{ color: "var(--color-text)" }}>{courseTitle}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                          <div className="h-full rounded-full" style={{ width: `${enr.progress}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }} />
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: "var(--color-primary)" }}>{enr.progress}%</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upgrade CTA — free users only */}
        {isFree && (
          <div className="p-6 sm:p-8 rounded-3xl text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white" />
              <div className="absolute bottom-4 right-4 w-40 h-40 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                {t("dashboard.upgradeTitle")}
              </h2>
              <p className="text-white/80 mb-5 max-w-xl mx-auto text-sm sm:text-base">
                {t("dashboard.upgradeDesc")}
              </p>
              <Link href={`/${locale}/subscriptions`} className="inline-block px-8 py-3 rounded-xl font-bold bg-white transition-all hover:scale-105" style={{ color: "var(--color-primary)" }}>
                {t("dashboard.upgradeBtn")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

interface AdminStats {
  users: { total: number; new_7d: number; by_role: Record<string, number> };
  lesson_plans: { total: number; published: number };
  marketplace: { services: number; published_services: number; categories: number; orders: number; revenue: number; orders_7d: number };
  ai: { runs: number; runs_7d: number; tokens: number; cost: number; avg_duration_ms: number };
  blog: { posts: number };
  courses: { courses: number; enrollments: number };
  gamification: { points_awarded: number; badges_issued: number };
}

export default function AdminPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get("/core/admin/stats/")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const statCards: { icon: string; value: string; label: string; sub: string; color: string }[] = stats ? [
    { icon: "👥", value: String(stats.users.total), label: t("admin.statUsers"), sub: `+${stats.users.new_7d} ${t("admin.statNew7d")}`, color: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" },
    { icon: "📝", value: String(stats.lesson_plans.total), label: t("admin.statLessonPlans"), sub: `${stats.lesson_plans.published} ${t("admin.statPublished")}`, color: "linear-gradient(135deg, var(--color-success), var(--color-accent))" },
    { icon: "🛒", value: String(stats.marketplace.orders), label: t("admin.statOrders"), sub: `${stats.marketplace.revenue.toLocaleString(locale === "ar" ? "ar-JO" : "en-US")} ${t("admin.currency")}`, color: "linear-gradient(135deg, var(--color-warning), var(--color-error))" },
    { icon: "🏪", value: String(stats.marketplace.services), label: t("admin.statServices"), sub: `${stats.marketplace.published_services} ${t("admin.statPublished")}`, color: "linear-gradient(135deg, var(--color-accent), var(--color-primary))" },
    { icon: "🤖", value: String(stats.ai.runs), label: t("admin.statAiRuns"), sub: `${stats.ai.tokens.toLocaleString()} ${t("admin.statTokens")}`, color: "linear-gradient(135deg, var(--color-secondary), var(--color-info, #0284c7))" },
    { icon: "📰", value: String(stats.blog.posts), label: t("admin.statBlogPosts"), sub: "", color: "linear-gradient(135deg, var(--color-error), var(--color-warning))" },
    { icon: "🎬", value: String(stats.courses.courses), label: t("admin.statCourses"), sub: `${stats.courses.enrollments} ${t("admin.statEnrollments")}`, color: "linear-gradient(135deg, var(--color-primary-light), var(--color-muted))" },
    { icon: "⭐", value: String(stats.gamification.points_awarded), label: t("admin.statPoints"), sub: `${stats.gamification.badges_issued} ${t("admin.statBadges")}`, color: "linear-gradient(135deg, var(--color-success-light), var(--color-warning))" },
  ] : [];

  const adminLinks = [
    { section: t("admin.contentSection"), items: [
      { href: `/${locale}/admin/pages`, title: t("admin.pages"), description: t("admin.pagesDesc"), icon: "📄", gradient: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" },
      { href: `/${locale}/admin/menus`, title: t("admin.menus"), description: t("admin.menusDesc"), icon: "📋", gradient: "linear-gradient(135deg, var(--color-accent), var(--color-primary))" },
      { href: `/${locale}/admin/templates`, title: t("admin.templates"), description: t("admin.templatesDesc"), icon: "📝", gradient: "linear-gradient(135deg, var(--color-success), var(--color-accent))" },
      { href: `/${locale}/admin/themes`, title: t("admin.themes"), description: t("admin.themesDesc"), icon: "🎨", gradient: "linear-gradient(135deg, var(--color-error), var(--color-warning))" },
      { href: `/${locale}/admin/settings`, title: t("admin.settings"), description: t("admin.settingsDesc"), icon: "⚙️", gradient: "linear-gradient(135deg, var(--color-text-muted), var(--color-border))" },
      { href: `/${locale}/admin/languages`, title: t("admin.languages"), description: t("admin.languagesDesc"), icon: "🌐", gradient: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" },
      { href: `/${locale}/admin/translations`, title: t("admin.translations"), description: t("admin.translationsDesc"), icon: "🗂️", gradient: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" },
      { href: `/${locale}/admin/feature-flags`, title: t("admin.featureFlags"), description: t("admin.featureFlagsDesc"), icon: "🚩", gradient: "linear-gradient(135deg, var(--color-warning), var(--color-error))" },
    ]},
    { section: t("admin.educationSection"), items: [
      { href: `/${locale}/admin/grades`, title: t("admin.grades"), description: t("admin.gradesDesc"), icon: "🎓", gradient: "linear-gradient(135deg, var(--color-primary-light), var(--color-muted))" },
      { href: `/${locale}/admin/subjects`, title: t("admin.subjects"), description: t("admin.subjectsDesc"), icon: "📚", gradient: "linear-gradient(135deg, var(--color-success-light), var(--color-muted))" },
      { href: `/${locale}/admin/curricula`, title: t("admin.curricula"), description: t("admin.curriculaDesc"), icon: "📋", gradient: "linear-gradient(135deg, var(--color-warning-light), var(--color-muted))" },
      { href: `/${locale}/admin/schools`, title: t("admin.schools") || "Schools & Follow-up", description: t("admin.schoolsDesc") || "Manage schools, sections, and WhatsApp alerts", icon: "🏫", gradient: "linear-gradient(135deg, var(--color-primary), var(--color-success))" },
      { href: `/${locale}/admin/organizations`, title: t("admin.organizations") || "Organizations", description: t("admin.organizationsDesc") || "Manage educational organizations", icon: "🏢", gradient: "linear-gradient(135deg, var(--color-accent), var(--color-secondary))" },
    ]},
    { section: t("admin.blogSection"), items: [
      { href: `/${locale}/admin/posts`, title: t("admin.blog"), description: t("admin.blogDesc"), icon: "📝", gradient: "linear-gradient(135deg, var(--color-accent), var(--color-success))" },
    ]},
    { section: t("admin.ebooksSection") || "E-Books", items: [
      { href: `/${locale}/admin/ebooks`, title: t("admin.ebooks") || "E-Books", description: t("admin.ebooksDesc") || "Manage e-books and categories", icon: "📚", gradient: "linear-gradient(135deg, var(--color-primary), var(--color-accent))" },
    ]},
    { section: t("admin.coursesSection"), items: [
      { href: `/${locale}/admin/courses`, title: t("admin.courses"), description: t("admin.coursesDesc"), icon: "🎬", gradient: "linear-gradient(135deg, var(--color-error), var(--color-primary))" },
    ]},
    { section: t("admin.marketplaceSection"), items: [
      { href: `/${locale}/admin/marketplace`, title: t("admin.marketplace"), description: t("admin.marketplaceDesc"), icon: "🏪", gradient: "linear-gradient(135deg, var(--color-warning), var(--color-success))" },
      { href: `/${locale}/admin/ai-runs`, title: t("admin.aiRuns"), description: t("admin.aiRunsDesc"), icon: "🤖", gradient: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" },
    ]},
    { section: t("admin.messagesSection"), items: [
      { href: `/${locale}/admin/messages`, title: t("admin.messages"), description: t("admin.messagesDesc"), icon: "✉️", gradient: "linear-gradient(135deg, var(--color-secondary), var(--color-accent))" },
      { href: `/${locale}/admin/newsletter`, title: t("admin.newsletterSubs"), description: t("admin.newsletterDesc"), icon: "📬", gradient: "linear-gradient(135deg, var(--color-success), var(--color-primary))" },
    ]},
    { section: t("admin.usersSection"), items: [
      { href: `/${locale}/admin/users`, title: t("admin.users"), description: t("admin.usersDesc"), icon: "👥", gradient: "linear-gradient(135deg, var(--color-warning), var(--color-error))" },
    ]},
    { section: t("admin.subscriptionsSection"), items: [
      { href: `/${locale}/admin/subscriptions`, title: t("admin.subscriptions"), description: t("admin.subscriptionsDesc"), icon: "💳", gradient: "linear-gradient(135deg, var(--color-secondary), var(--color-success))" },
    ]},
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.title")}</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{t("admin.dashboard")}</p>
      </div>

      {statsLoading ? (
        <div className="text-center py-8 mb-8" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="p-4 rounded-3xl flex items-center gap-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: card.color }}>
                <span className="text-xl">{card.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight truncate" style={{ color: "var(--color-text)" }}>{card.value}</p>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-secondary)" }}>{card.label}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--color-text-muted)" }}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {adminLinks.map((section) => (
        <div key={section.section} className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-secondary)" }}>{section.section}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.items.map((link) => (
              <Link key={link.href} href={link.href}
                className="group p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-sm" style={{ background: link.gradient }}>
                  <span className="text-2xl">{link.icon}</span>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{link.title}</h3>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

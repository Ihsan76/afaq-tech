"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

// Roles allowed into /admin (mirrors backend apps/users/permissions.py)
const ADMIN_ROLES = ["admin", "developer", "support", "content_manager", "finance"];

// Section key -> roles that may see it (admin sees all)
const SECTION_ROLES: Record<string, string[]> = {
  content:       ["developer", "content_manager"],
  education:     ["developer", "content_manager"],
  blog:          ["developer", "content_manager"],
  ebooks:        ["developer", "content_manager"],
  courses:       ["developer", "content_manager"],
  marketplace:   ["developer"],
  ai:            ["developer"],
  messages:      ["developer", "support"],
  users:         ["developer", "support"],
  subscriptions: ["finance"],
  organizations: ["developer"],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading, loadUser } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => { loadUser().finally(() => setChecked(true)); }, [loadUser]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isAdmin = !!user && (ADMIN_ROLES.includes(user.role) || user.is_staff);
  const denied = checked && (!user || !isAdmin);

  const isActive = (href: string) => pathname.includes(href);

  const canSee = (section: string) =>
    !!user && (user.is_staff || user.role === "admin" || (SECTION_ROLES[section] || []).includes(user.role));

  const ALL_NAV_ITEMS = [
    { key: "content", section: t("admin.contentSection"), items: [
      { href: "/admin/pages", label: t("admin.pages"), icon: "📄" },
      { href: "/admin/menus", label: t("admin.menus"), icon: "📋" },
      { href: "/admin/templates", label: t("admin.templates"), icon: "📝" },
      { href: "/admin/themes", label: t("admin.themes"), icon: "🎨" },
      { href: "/admin/settings", label: t("admin.settings"), icon: "⚙️" },
      { href: "/admin/languages", label: t("admin.languages"), icon: "🌐" },
      { href: "/admin/translations", label: t("admin.translations"), icon: "🗂️" },
      { href: "/admin/feature-flags", label: t("admin.featureFlags"), icon: "🚩" },
    ]},
    { key: "education", section: t("admin.educationSection"), items: [
      { href: "/admin/grades", label: t("admin.grades"), icon: "🎓" },
      { href: "/admin/subjects", label: t("admin.subjects"), icon: "📚" },
      { href: "/admin/curricula", label: t("admin.curricula"), icon: "📋" },
      { href: "/admin/schools", label: t("admin.schools") || "المدارس والمتابعة", icon: "🏫" },
    ]},
    { key: "blog", section: t("admin.blogSection"), items: [
      { href: "/admin/posts", label: t("admin.blog"), icon: "📝" },
    ]},
    { key: "ebooks", section: t("admin.ebooksSection") || "E-Books", items: [
      { href: "/admin/ebooks", label: t("admin.ebooks") || "E-Books", icon: "📚" },
    ]},
    { key: "courses", section: t("admin.coursesSection"), items: [
      { href: "/admin/courses", label: t("admin.courses"), icon: "🎬" },
    ]},
    { key: "marketplace", section: t("admin.marketplaceSection"), items: [
      { href: "/admin/marketplace", label: t("admin.marketplace"), icon: "🏪" },
      { href: "/admin/ai-runs", label: t("admin.aiRuns"), icon: "🤖" },
    ]},
    { key: "ai", section: "AI", items: [
      { href: "/admin/ai-models", label: "نماذج AI", icon: "🤖" },
      { href: "/admin/prompts", label: "البرومبتات", icon: "📝" },
    ]},
    { key: "messages", section: t("admin.messagesSection"), items: [
      { href: "/admin/messages", label: t("admin.messages"), icon: "✉️" },
      { href: "/admin/newsletter", label: t("admin.newsletterSubs"), icon: "📬" },
    ]},
    { key: "users", section: t("admin.usersSection"), items: [
      { href: "/admin/users", label: t("admin.users"), icon: "👥" },
    ]},
    { key: "subscriptions", section: t("admin.subscriptionsSection"), items: [
      { href: "/admin/subscriptions", label: t("admin.subscriptions"), icon: "💳" },
    ]},
    { key: "organizations", section: t("admin.organizationsSection"), items: [
      { href: "/admin/organizations", label: t("admin.organizations"), icon: "🏫" },
    ]},
  ];

  const NAV_ITEMS = ALL_NAV_ITEMS.filter((s) => canSee(s.key));

  const isRtl = ["ar", "ur", "fa", "he"].includes(locale);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const active = NAV_ITEMS.find((s) => s.items.some((item) => isActive(item.href)));
    return active ? { [active.section]: true } : {};
  });

  useEffect(() => {
    const active = NAV_ITEMS.find((s) => s.items.some((item) => pathname.includes(item.href)));
    if (active) {
      setExpandedSections((prev) => (prev[active.section] ? prev : { ...prev, [active.section]: true }));
    }
  }, [pathname]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        {!collapsed && (
          <Link href={`/${locale}/admin`} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>آ</div>
            <span className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{t("admin.dashboard")}</span>
          </Link>
        )}
        <button onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity hidden md:block" style={{ color: "var(--color-text-muted)" }}>
          {collapsed ? "→" : "←"}
        </button>
        <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:opacity-80 transition-opacity md:hidden" style={{ color: "var(--color-text-muted)" }}>
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map((section) => {
          const isExpanded = !!expandedSections[section.section];
          const hasActive = section.items.some((item) => isActive(item.href));
          const showItems = collapsed || isExpanded;
          return (
            <div key={section.section} className="mb-4">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.section)}
                  className="w-full flex items-center justify-between px-3 py-1.5 mb-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:opacity-80"
                  style={{ color: hasActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
                >
                  <span>{section.section}</span>
                  <span
                    className="text-[10px] transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(0deg)" : isRtl ? "rotate(90deg)" : "rotate(-90deg)" }}
                  >
                    ▾
                  </span>
                </button>
              )}
              {showItems && section.items.map((item) => (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5"
                  style={{
                    background: isActive(item.href) ? "var(--color-primary)" : "transparent",
                    color: isActive(item.href) ? "#FFFFFF" : "var(--color-text-secondary)",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <Link
          href={`/${locale}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="text-lg">🏠</span>
          {!collapsed && <span>{t("admin.backToSite")}</span>}
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Auth gate */}
      {denied && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "var(--color-background)" }}>
          <div className="text-center p-8 rounded-3xl max-w-md mx-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
              {user ? t("admin.accessDenied") : t("admin.loginRequired")}
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              {user ? t("admin.adminOnly") : t("admin.pleaseLogin")}
            </p>
            <Link
              href={`/${locale}/login`}
              className="inline-block px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: "var(--color-primary)" }}
            >
              {t("auth.login")}
            </Link>
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col border-l transition-all duration-300 flex-shrink-0"
        style={{
          width: collapsed ? "72px" : "260px",
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 bottom-0 w-72 flex flex-col" style={{ background: "var(--color-surface)", borderRight: "1px solid var(--color-border)" }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b flex-shrink-0" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg md:hidden"
              style={{ color: "var(--color-text)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-bold truncate" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.dashboard")}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} className="hidden sm:inline-flex px-3 py-1.5 text-sm rounded-lg transition-all hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>
              {t("admin.backToSite")}
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

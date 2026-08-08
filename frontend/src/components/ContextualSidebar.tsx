"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";

const ADMIN_ROLES = ["admin", "developer", "support", "content_manager", "finance"];
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

export default function ContextualSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("nav");
  const adminT = useTranslations("admin");
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isAdminRoute = pathname.includes("/admin");

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const pathParts = pathname.split("/");
  const service = pathParts[2] || "";

  // If service has no specific management/contextual items, hide sidebar (return null)
  const supportedServices = ["academy", "ebooks", "school", "curriculum", "lesson-plans", "dashboard", "profile", "gamification", "subscriptions"];
  const shouldShow = isAdminRoute || (service && supportedServices.includes(service)) || pathname.includes("/dashboard");
  if (!shouldShow) {
    return null;
  }

  const canSee = (section: string) =>
    !!user && (user.is_staff || user.role === "admin" || (SECTION_ROLES[section] || []).includes(user.role));

  const ALL_NAV_ITEMS = [
    { key: "content", section: adminT("contentSection") || "المحتوى", items: [
      { href: `/${locale}/admin/pages`, label: adminT("pages") || "الصفحات", icon: "📄" },
      { href: `/${locale}/admin/menus`, label: adminT("menus") || "القوائم", icon: "📋" },
      { href: `/${locale}/admin/templates`, label: adminT("templates") || "القوالب", icon: "📝" },
      { href: `/${locale}/admin/themes`, label: adminT("themes") || "الثيمات", icon: "🎨" },
      { href: `/${locale}/admin/settings`, label: adminT("settings") || "الإعدادات", icon: "⚙️" },
      { href: `/${locale}/admin/languages`, label: adminT("languages") || "اللغات", icon: "🌐" },
      { href: `/${locale}/admin/translations`, label: adminT("translations") || "الترجمات", icon: "🗂️" },
      { href: `/${locale}/admin/feature-flags`, label: adminT("featureFlags") || "الأعلام", icon: "🚩" },
    ]},
    { key: "education", section: adminT("educationSection") || "التعليم", items: [
      { href: `/${locale}/admin/grades`, label: adminT("grades") || "الصفوف", icon: "🎓" },
      { href: `/${locale}/admin/subjects`, label: adminT("subjects") || "المواد", icon: "📚" },
      { href: `/${locale}/admin/curricula`, label: adminT("curricula") || "المناهج", icon: "📋" },
      { href: `/${locale}/admin/schools`, label: adminT("schools") || "المدارس والمتابعة", icon: "🏫" },
    ]},
    { key: "blog", section: adminT("blogSection") || "المدونة", items: [
      { href: `/${locale}/admin/posts`, label: adminT("blog") || "المقالات", icon: "📝" },
    ]},
    { key: "ebooks", section: adminT("ebooksSection") || "الكتب الإلكترونية", items: [
      { href: `/${locale}/admin/ebooks`, label: adminT("ebooks") || "الكتب", icon: "📚" },
    ]},
    { key: "courses", section: adminT("coursesSection") || "الدورات", items: [
      { href: `/${locale}/admin/courses`, label: adminT("courses") || "الدورات", icon: "🎬" },
    ]},
    { key: "marketplace", section: adminT("marketplaceSection") || "السوق", items: [
      { href: `/${locale}/admin/marketplace`, label: adminT("marketplace") || "السوق", icon: "🏪" },
      { href: `/${locale}/admin/ai-runs`, label: adminT("aiRuns") || "سجلات الذكاء", icon: "🤖" },
    ]},
    { key: "ai", section: "AI", items: [
      { href: `/${locale}/admin/ai-models`, label: "نماذج AI", icon: "🤖" },
      { href: `/${locale}/admin/prompts`, label: "البرومبتات", icon: "📝" },
    ]},
    { key: "messages", section: adminT("messagesSection") || "الرسائل", items: [
      { href: `/${locale}/admin/messages`, label: adminT("messages") || "الرسائل", icon: "✉️" },
      { href: `/${locale}/admin/newsletter`, label: adminT("newsletterSubs") || "النشرة", icon: "📬" },
    ]},
    { key: "users", section: adminT("usersSection") || "المستخدمين", items: [
      { href: `/${locale}/admin/users`, label: adminT("users") || "المستخدمين", icon: "👥" },
    ]},
    { key: "subscriptions", section: adminT("subscriptionsSection") || "الاشتراكات", items: [
      { href: `/${locale}/admin/subscriptions`, label: adminT("subscriptions") || "الاشتراكات", icon: "💳" },
    ]},
    { key: "organizations", section: adminT("organizationsSection") || "المنظمات", items: [
      { href: `/${locale}/admin/organizations`, label: adminT("organizations") || "المنظمات", icon: "🏫" },
    ]},
  ];

  const NAV_ITEMS = isAdminRoute ? ALL_NAV_ITEMS.filter((s) => canSee(s.key)) : [];

  let contextualItems: Array<{ href: string; label: string; icon: string }> = [];

  if (!isAdminRoute) {
    if (service === "academy") {
      contextualItems = [
        { href: `/${locale}/academy`, label: t("academyHome") || "رئيسية الأكاديمية", icon: "🎬" },
        { href: `/${locale}/academy/courses`, label: t("courses") || "جميع الدورات", icon: "📚" },
        { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
      ];
    } else if (service === "ebooks") {
      contextualItems = [
        { href: `/${locale}/ebooks`, label: t("ebooksHome") || "مكتبة الكتب", icon: "📖" },
        { href: `/${locale}/subscriptions`, label: t("subscriptions") || "الباقات", icon: "💳" },
        { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
      ];
    } else if (service === "school") {
      contextualItems = [
        { href: `/${locale}/school`, label: t("schoolHome") || "رئيسية آفاق مدرستي", icon: "🏫" },
        { href: `/${locale}/notifications`, label: t("notifications") || "التنبيهات", icon: "🔔" },
        { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
      ];
    } else if (service === "curriculum" || service === "lesson-plans") {
      contextualItems = [
        { href: `/${locale}/curriculum`, label: t("curriculum") || "المناهج الدراسية", icon: "📚" },
        { href: `/${locale}/lesson-plans`, label: t("lessonPlans") || "خطط الدروس", icon: "📝" },
        { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
      ];
    } else {
      contextualItems = [
        { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
        { href: `/${locale}/school`, label: t("school") || "آفاق مدرستي", icon: "🏫" },
        { href: `/${locale}/academy`, label: t("academy") || "الأكاديمية", icon: "🎬" },
        { href: `/${locale}/curriculum`, label: t("curriculum") || "المناهج الدراسية", icon: "📚" },
        { href: `/${locale}/ebooks`, label: t("ebooks") || "الكتب الإلكترونية", icon: "📖" },
        { href: `/${locale}/gamification`, label: t("gamification") || "التلعيب والشارات", icon: "🎮" },
        { href: `/${locale}/subscriptions`, label: t("subscriptions") || "الاشتراكات", icon: "💳" },
        { href: `/${locale}/profile`, label: t("profile") || "الملف الشخصي", icon: "👤" },
      ];
    }
  }

  const isActive = (href: string) => pathname === href || (href !== `/${locale}/admin` && pathname.includes(href));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b bg-[var(--color-surface)]" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
        >
          <span>📂</span>
          <span>{mobileOpen ? "إغلاق القائمة" : "القائمة الجانبية"}</span>
        </button>
        <span className="text-xs font-semibold truncate" style={{ color: "var(--color-text-muted)" }}>
          {isAdminRoute ? "الإدارة" : service || "ساحة العمل"}
        </span>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="w-72 h-full p-4 overflow-y-auto shadow-2xl flex flex-col"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                {isAdminRoute ? "قائمة الإدارة الشاملة" : "القائمة السياقية"}
              </span>
              <button onClick={() => setMobileOpen(false)} className="text-base font-bold" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            
            {/* Render items inside mobile drawer */}
            <nav className="space-y-1.5 flex-1">
              {isAdminRoute ? (
                NAV_ITEMS.map((group) => {
                  const isExpanded = !!expandedSections[group.section];
                  const hasActive = group.items.some((i) => isActive(i.href));
                  return (
                    <div key={group.key} className="space-y-1">
                      <button
                        onClick={() => toggleSection(group.section)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          hasActive ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : ""
                        }`}
                        style={{ color: hasActive ? "var(--color-primary)" : "var(--color-text)" }}
                      >
                        <span className="truncate">{group.section}</span>
                        <span className="text-[10px]">{isExpanded ? "▼" : "◀"}</span>
                      </button>

                      {(isExpanded || hasActive) && (
                        <div className="ms-2 ps-2 border-s border-[var(--color-border)] space-y-1">
                          {group.items.map((item) => {
                            const active = isActive(item.href);
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                                style={{
                                  backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                                  color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                                }}
                              >
                                <span className="text-base shrink-0">{item.icon}</span>
                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                contextualItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                        color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                      }}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        aria-label="Contextual Navigation"
        className={`shrink-0 hidden md:flex flex-col py-4 px-2 border-e min-h-[calc(100vh-4rem)] transition-all duration-300 relative ${
          collapsed ? "w-14" : "w-52"
        }`}
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -top-3 end-2.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-md text-[9px] transition-all hover:scale-110 z-10"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          title={collapsed ? "توسيع القائمة" : "تصغير القائمة"}
        >
          {collapsed ? "◀" : "▶"}
        </button>

        {!collapsed && (
          <div className="mb-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-muted)" }}>
              {isAdminRoute ? "قائمة الإدارة الشاملة" : service ? `قائمة ${service}` : "ساحة العمل"}
            </p>
          </div>
        )}

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
          {isAdminRoute ? (
            // Admin collapsible sections
            NAV_ITEMS.map((group) => {
              const isExpanded = !!expandedSections[group.section];
              const hasActive = group.items.some((i) => isActive(i.href));
              return (
                <div key={group.key} className="space-y-1">
                  <button
                    onClick={() => toggleSection(group.section)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      hasActive ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : ""
                    }`}
                    style={{ color: hasActive ? "var(--color-primary)" : "var(--color-text)" }}
                    title={collapsed ? group.section : undefined}
                  >
                    {!collapsed && <span className="truncate">{group.section}</span>}
                    {collapsed && <span className="mx-auto text-sm">{group.items[0]?.icon || "📁"}</span>}
                    {!collapsed && <span className="text-[9px]">{isExpanded ? "▼" : "◀"}</span>}
                  </button>

                  {(isExpanded || collapsed || hasActive) && (
                    <div className={`space-y-1 ${collapsed ? "" : "ms-1.5 ps-1.5 border-s border-[var(--color-border)]"}`}>
                      {group.items.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              collapsed ? "justify-center px-0.5" : ""
                            }`}
                            style={{
                              backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                              color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                            }}
                          >
                            <span className="text-base shrink-0">{item.icon}</span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Contextual service items
            contextualItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    collapsed ? "justify-center px-0.5" : ""
                  }`}
                  style={{
                    backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })
          )}
        </nav>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import { useApiList } from "@/lib/useApi";

import SchoolSelector from "@/components/school/SchoolSelector";

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

interface SidebarItem {
  id: number;
  title: string;
  url?: string;
  resolved_url?: string;
  icon?: string;
  badge?: string;
  is_active?: boolean;
  required_role?: string[] | string;
  service_context?: string[] | string;
  children?: SidebarItem[];
}

function localizeHref(href: string, locale: string): string {
  if (!href || href === "#") return href || "#";
  if (href.startsWith("http") || href.startsWith("mailto:")) return href;
  if (href.startsWith(`/${locale}`)) return href;
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export default function ContextualSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const adminT = useTranslations("admin");
  const schoolT = useTranslations("school");
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const pathParts = pathname.split("/");
  const service = pathParts[2] || "";
  const isAdminRoute = pathParts[2] === "admin";

  // Hide sidebar on auth / admin routes
  const hideSidebarRoutes = ["login", "register", "forgot-password", "reset-password", "verify-email", "admin", "auth"];
  const shouldShow = !isAdminRoute && !hideSidebarRoutes.includes(service);

  // Role workspaces share the school sidebar context (items defined in the admin menus)
  const roleServices = ["teacher", "parent", "student"];
  // Dynamic sidebar items fetched from admin (no hardcoding) — hooks must run unconditionally
  const sidebarContext = isAdminRoute ? "admin" : (roleServices.includes(service) ? "school" : (service || "all"));
  const { data: sidebarItems, loading: sidebarLoading } = useApiList<SidebarItem>(
    (isAdminRoute || !shouldShow) ? null : `/pages/menu/sidebar/`,
    { locale, context: sidebarContext }
  );

  const roleAllowed = (item: SidebarItem) => {
    const roles = item.required_role;
    if (!roles || (Array.isArray(roles) && roles.length === 0)) return true;
    const list = Array.isArray(roles) ? roles : [roles];
    if (list.includes("all")) return true;
    if (!user) return false;
    if (user.is_staff || user.role === "admin" || user.role === "developer" || (user.roles && user.roles.includes("admin"))) return true;
    return list.includes(user.role) || (user.roles && list.some(r => user.roles.includes(r)));
  };

  const contextualItems = useMemo(() => {
    if (isAdminRoute || !shouldShow || sidebarLoading) return [];
    return (sidebarItems || [])
      .filter((item) => item.is_active !== false)
      .filter(roleAllowed)
      .map((item) => ({
        href: localizeHref(item.resolved_url || item.url || "#", locale),
        label: item.title || item.url || "#",
        icon: item.icon || "🔗",
        badge: item.badge || "",
        roles: Array.isArray(item.required_role) ? item.required_role : [],
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminRoute, shouldShow, sidebarLoading, sidebarItems, locale, user]);

  const groupLabel = (key: string) => {
    if (key === "school_admin") return schoolT("roleSchoolAdmin");
    if (key === "teacher") return schoolT("roleTeacher");
    if (key === "parent") return schoolT("roleParent");
    if (key === "student") return schoolT("roleStudent");
    if (key === "school_accountant") return schoolT("roleAccountant");
    if (key === "school_transport_officer") return schoolT("roleTransportOfficer");
    if (key === "school_librarian") return schoolT("roleLibrarian");
    return schoolT("roleGeneral");
  };

  const isSchoolContext = roleServices.includes(service) || service === "school";
  const isStaff = !!(user && (user.is_staff || user.role === "admin" || user.role === "developer" || (user.roles && user.roles.includes("admin"))));
  const SCHOOL_GROUP_KEYS = ["school_admin", "teacher", "parent", "student", "school_accountant", "school_transport_officer", "school_librarian", "creator"] as const;

  const pickGroupKey = (roles: string[]) => {
    if (!roles || roles.length === 0 || roles.includes("all")) return "general";
    const keys = SCHOOL_GROUP_KEYS as readonly string[];
    const specific = roles.find((r) => keys.includes(r) && r !== "school_admin");
    if (specific) return specific;
    return roles.find((r) => keys.includes(r)) || "general";
  };

  const schoolGroups = useMemo(() => {
    if (isAdminRoute || !shouldShow || sidebarLoading) return [];
    const rawItems = (sidebarItems || [])
      .filter((item) => item.is_active !== false)
      .filter(roleAllowed)
      .map((item) => ({
        href: localizeHref(item.resolved_url || item.url || "#", locale),
        label: item.title || item.url || "#",
        icon: item.icon || "🔗",
        badge: item.badge || "",
        roles: Array.isArray(item.required_role) ? item.required_role : (item.required_role ? [item.required_role] : []),
      }));

    if (isStaff) {
      const roleMap: Record<string, typeof rawItems> = {};
      const general: typeof rawItems = [];

      for (const item of rawItems) {
        const key = pickGroupKey(item.roles);
        if (key === "general") {
          general.push(item);
        } else {
          if (!roleMap[key]) roleMap[key] = [];
          roleMap[key].push(item);
        }
      }

      const groups = Object.entries(roleMap).map(([role, gItems]) => ({
        key: role,
        label: groupLabel(role),
        items: gItems,
      }));

      if (general.length > 0) {
        groups.push({ key: "general", label: groupLabel("general"), items: general });
      }

      return groups;
    }

    if (!isSchoolContext) {
      return [{ key: "flat", label: "", items: rawItems }];
    }

    const groups = SCHOOL_GROUP_KEYS.map((key) => ({ key, label: groupLabel(key), items: [] as typeof rawItems }));
    const general = { key: "general", label: groupLabel("general"), items: [] as typeof rawItems };
    for (const item of rawItems) {
      const key = pickGroupKey(item.roles);
      const group = groups.find((g) => g.key === key) || general;
      group.items.push(item);
    }
    return [...groups.filter((g) => g.items.length > 0), ...(general.items.length ? [general] : [])];
  }, [isAdminRoute, shouldShow, sidebarLoading, sidebarItems, locale, user, isStaff, isSchoolContext]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user || !shouldShow) {
    return null;
  }

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const canSee = (section: string) =>
    !!user && (user.is_staff || user.role === "admin" || (user.roles && user.roles.includes("admin")) || (SECTION_ROLES[section] || []).includes(user.role) || (user.roles && (SECTION_ROLES[section] || []).some(r => user.roles.includes(r))));

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





  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isActive = (href: string) => pathname === href || (href !== `/${locale}/admin` && pathname.includes(href));

  const NAV_ITEMS = isAdminRoute ? ALL_NAV_ITEMS.filter((s) => canSee(s.key)) : [];

  const hasContent = isAdminRoute
    ? NAV_ITEMS.length > 0
    : schoolGroups.some((g) => g.items.length > 0);

  if (!hasContent) {
    return null;
  }

  const renderNavContent = (isMobile = false) => (
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
                title={!isMobile && collapsed ? group.section : undefined}
              >
                {(!isMobile && collapsed) ? (
                  <span className="mx-auto text-sm">{group.items[0]?.icon || "📁"}</span>
                ) : (
                  <>
                    <span className="truncate">{group.section}</span>
                    <span className="text-[10px]">{isExpanded ? "▼" : "◀"}</span>
                  </>
                )}
              </button>

              {(isExpanded || (isMobile ? false : collapsed) || hasActive) && (
                <div className={`space-y-1 ${(!isMobile && collapsed) ? "" : "ms-2 ps-2 border-s border-[var(--color-border)]"}`}>
                  {group.items.map((item, index) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={`${item.href}-${index}`}
                        href={item.href}
                        onClick={() => isMobile && setMobileOpen(false)}
                        title={(!isMobile && collapsed) ? item.label : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          (!isMobile && collapsed) ? "justify-center px-1" : ""
                        }`}
                        style={{
                          backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                          color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}
                      >
                        <span className="text-base shrink-0">{item.icon}</span>
                        {(!isMobile && collapsed) ? null : <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : (
        schoolGroups.map((group) => {
          const sectionLabel = group.label || groupLabel(group.key);
          const isExpanded = !!expandedSections[sectionLabel];
          const hasActive = group.items.some((i: any) => isActive(i.href));
          if (group.key === "flat") {
            return group.items.map((item: any, index: number) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={`${item.href}-${index}`}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  title={(!isMobile && collapsed) ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    (!isMobile && collapsed) ? "justify-center px-1" : ""
                  }`}
                  style={{
                    backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                    color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                  }}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {(!isMobile && collapsed) ? null : <span className="truncate">{item.label}</span>}
                </Link>
              );
            });
          }

          return (
            <div key={group.key} className="space-y-1">
              <button
                onClick={() => toggleSection(sectionLabel)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  hasActive ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]" : ""
                }`}
                style={{ color: hasActive ? "var(--color-primary)" : "var(--color-text)" }}
                title={(!isMobile && collapsed) ? sectionLabel : undefined}
              >
                {(!isMobile && collapsed) ? (
                  <span className="mx-auto text-sm">{group.items[0]?.icon || "📁"}</span>
                ) : (
                  <>
                    <span className="truncate">{sectionLabel}</span>
                    <span className="text-[10px]">{isExpanded ? "▼" : "◀"}</span>
                  </>
                )}
              </button>

              {(isExpanded || (isMobile ? false : collapsed) || hasActive) && (
                <div className={`space-y-1 ${(!isMobile && collapsed) ? "" : "ms-2 ps-2 border-s border-[var(--color-border)]"}`}>
                  {group.items.map((item: any, index: number) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={`${item.href}-${index}`}
                        href={item.href}
                        onClick={() => isMobile && setMobileOpen(false)}
                        title={(!isMobile && collapsed) ? item.label : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          (!isMobile && collapsed) ? "justify-center px-1" : ""
                        }`}
                        style={{
                          backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                          color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                        }}
                      >
                        <span className="text-base shrink-0">{item.icon}</span>
                        {(!isMobile && collapsed) ? null : <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </nav>
  );

  return (
    <aside
      aria-label="Contextual Navigation"
      className={`shrink-0 hidden md:flex flex-col pt-8 pb-4 px-2 border-e min-h-[calc(100vh-4rem)] transition-all duration-300 relative ${
        collapsed ? "w-14" : "w-48"
      }`}
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-2 end-2.5 w-5 h-5 rounded-full flex items-center justify-center border shadow-md text-[9px] transition-all hover:scale-110 z-10"
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
        <div className="mb-3 px-2 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-muted)" }}>
            {isAdminRoute ? "قائمة الإدارة" : service ? `قائمة ${service}` : "ساحة العمل"}
          </p>
          {service === "school" && <SchoolSelector />}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-0.5">
        {renderNavContent(false)}
      </div>
    </aside>
  );
}

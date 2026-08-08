"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export default function ContextualSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("nav");
  const adminT = useTranslations("admin");
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const isAdminRoute = pathname.includes("/admin");

  // Load collapse state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const pathParts = pathname.split("/");
  const service = pathParts[2] || "";

  let items: Array<{ href: string; label: string; icon: string; group?: string }> = [];

  if (isAdminRoute && user && (user.role === "admin" || user.is_staff || ["developer", "support", "content_manager", "finance"].includes(user.role))) {
    // Admin comprehensive sidebar when in /admin
    items = [
      { href: `/${locale}/admin`, label: adminT("dashboard") || "لوحة التحكم", icon: "⚙️" },
      { href: `/${locale}/admin/pages`, label: adminT("pages") || "الصفحات", icon: "📄" },
      { href: `/${locale}/admin/courses`, label: adminT("courses") || "الدورات", icon: "🎬" },
      { href: `/${locale}/admin/ebooks`, label: adminT("ebooks") || "الكتب", icon: "📖" },
      { href: `/${locale}/admin/schools`, label: adminT("schools") || "المدارس", icon: "🏫" },
      { href: `/${locale}/admin/users`, label: adminT("users") || "المستخدمين", icon: "👥" },
      { href: `/${locale}/admin/subscriptions`, label: adminT("subscriptions") || "الاشتراكات", icon: "💳" },
      { href: `/${locale}/admin/themes`, label: adminT("themes") || "الثيمات", icon: "🎨" },
      { href: `/${locale}/admin/settings`, label: adminT("settings") || "الإعدادات", icon: "🔧" },
      { href: `/${locale}/dashboard`, label: "العودة لساحة العمل", icon: "📊" },
    ];
  } else if (service === "academy") {
    items = [
      { href: `/${locale}/academy`, label: t("academyHome") || "رئيسية الأكاديمية", icon: "🎬" },
      { href: `/${locale}/academy/courses`, label: t("courses") || "جميع الدورات", icon: "📚" },
      { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
    ];
  } else if (service === "ebooks") {
    items = [
      { href: `/${locale}/ebooks`, label: t("ebooksHome") || "مكتبة الكتب", icon: "📖" },
      { href: `/${locale}/subscriptions`, label: t("subscriptions") || "الباقات", icon: "💳" },
      { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
    ];
  } else if (service === "school") {
    items = [
      { href: `/${locale}/school`, label: t("schoolHome") || "رئيسية آفاق مدرستي", icon: "🏫" },
      { href: `/${locale}/notifications`, label: t("notifications") || "التنبيهات", icon: "🔔" },
      { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
    ];
  } else if (service === "curriculum" || service === "lesson-plans") {
    items = [
      { href: `/${locale}/curriculum`, label: t("curriculum") || "المناهج الدراسية", icon: "📚" },
      { href: `/${locale}/lesson-plans`, label: t("lessonPlans") || "خطط الدروس", icon: "📝" },
      { href: `/${locale}/dashboard`, label: t("dashboard") || "لوحة التحكم", icon: "📊" },
    ];
  } else {
    items = [
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

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      aria-label="Contextual Navigation"
      className={`shrink-0 hidden md:flex flex-col py-6 px-3 border-e min-h-[calc(100vh-4rem)] transition-all duration-300 relative ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -top-3 end-3 w-7 h-7 rounded-full flex items-center justify-center border shadow-md text-xs transition-all hover:scale-110 z-10"
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
        <div className="mb-6 px-3">
          <p className="text-xs font-bold uppercase tracking-wider truncate" style={{ color: "var(--color-text-muted)" }}>
            {isAdminRoute ? "قائمة الإدارة الشاملة" : service ? `قائمة ${service}` : "ساحة العمل الشاملة"}
          </p>
        </div>
      )}

      <nav className="space-y-1.5 flex-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                collapsed ? "justify-center px-2" : ""
              }`}
              style={{
                backgroundColor: active ? "var(--color-primary-light)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
              }}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

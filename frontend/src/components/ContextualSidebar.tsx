"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ContextualSidebar() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("nav");

  const pathParts = pathname.split("/");
  const service = pathParts[2] || "";

  let items: Array<{ href: string; label: string; icon: string }> = [];

  if (service === "academy") {
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
    // General global dashboard / workspace sidebar
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
    <aside aria-label="Contextual Navigation" className="w-64 shrink-0 hidden md:block py-6 px-4 border-e min-h-[calc(100vh-4rem)]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
      <div className="mb-6 px-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          {service ? `قائمة ${service}` : "ساحة العمل الشاملة"}
        </p>
      </div>
      <nav className="space-y-1.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              backgroundColor: isActive(item.href) ? "var(--color-primary-light)" : "transparent",
              color: isActive(item.href) ? "var(--color-primary)" : "var(--color-text-secondary)",
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

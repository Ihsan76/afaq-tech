"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function AdminPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

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
    { section: t("admin.messagesSection"), items: [
      { href: `/${locale}/admin/messages`, title: t("admin.messages"), description: t("admin.messagesDesc"), icon: "✉️", gradient: "linear-gradient(135deg, var(--color-secondary), var(--color-accent))" },
      { href: `/${locale}/admin/newsletter`, title: t("admin.newsletterSubs"), description: t("admin.newsletterDesc"), icon: "📬", gradient: "linear-gradient(135deg, var(--color-success), var(--color-primary))" },
    ]},
    { section: t("admin.usersSection"), items: [
      { href: `/${locale}/admin/users`, title: t("admin.users"), description: t("admin.usersDesc"), icon: "👥", gradient: "linear-gradient(135deg, var(--color-warning), var(--color-error))" },
    ]},
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.title")}</h1>
        <p style={{ color: "var(--color-text-muted)" }}>{t("admin.dashboard")}</p>
      </div>

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

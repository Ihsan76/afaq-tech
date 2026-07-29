"use client";

import { useTranslations } from "next-intl";
import { localizedContent } from "@/lib/i18n";

export default function PortfolioShowcase({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultProjects = [
    { icon: "🏫", title: t("portfolioProject1Title"), desc: t("portfolioProject1Desc"), tags: [t("portfolioTagWeb"), t("portfolioTagEducation")] },
    { icon: "🛒", title: t("portfolioProject2Title"), desc: t("portfolioProject2Desc"), tags: [t("portfolioTagEcommerce"), t("portfolioTagDesign")] },
    { icon: "📱", title: t("portfolioProject3Title"), desc: t("portfolioProject3Desc"), tags: [t("portfolioTagSocial"), t("portfolioTagMarketing")] },
  ];

  const projects = c.items?.map((item: any, i: number) => ({
    icon: "📂",
    title: localizedContent(item, "title", locale),
    desc: localizedContent(item, "desc", locale),
    tags: [localizedContent(item, "category", locale)].filter(Boolean),
  })) || defaultProjects;

  return (
    <section id="portfolio" className="py-16 sm:py-24" style={{ background: "var(--color-surface-alt)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 animate-fade-in-up" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {localizedContent(c, "title", locale, t("portfolioTitle"))}
          </h2>
          <p className="text-lg max-w-2xl mx-auto animate-fade-in-up delay-100" style={{ color: "var(--color-text-muted)" }}>
            {localizedContent(c, "subtitle", locale) || t("portfolioSubtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          {projects.map((project: any, i: number) => (
            <div key={i} className={`group p-6 sm:p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up delay-${(i + 2) * 100}`} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm" style={{ background: "var(--color-primary-light)" }}>
                <span className="text-3xl">{project.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{project.title}</h3>
              <p className="mb-4 leading-relaxed text-sm" style={{ color: "var(--color-text-muted)" }}>{project.desc}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag: string, j: number) => (
                  <span key={j} className="px-3 py-1 text-xs font-medium rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

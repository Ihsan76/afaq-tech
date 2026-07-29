"use client";

import { useTranslations } from "next-intl";
import { localizedContent } from "@/lib/i18n";

export default function SubjectsGrid({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const c = content || {};
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";

  const defaultSubjects = [
    { icon: "📐", name: t("subjectMath"), color: "var(--color-primary-light)" },
    { icon: "🔬", name: t("subjectScience"), color: "var(--color-success-light)" },
    { icon: "📖", name: t("subjectArabic"), color: "var(--color-accent-light)" },
    { icon: "🌍", name: t("subjectEnglish"), color: "var(--color-warning-light)" },
    { icon: "🎨", name: t("subjectArt"), color: "var(--color-error-light)" },
    { icon: "💻", name: t("subjectCS"), color: "var(--color-primary-light)" },
    { icon: "🕌", name: t("subjectIslamic"), color: "var(--color-success-light)" },
    { icon: "🏃", name: t("subjectPE"), color: "var(--color-accent-light)" },
  ];

  const subjects = c.subjects?.map((s: any, i: number) => ({
    icon: s.icon || defaultSubjects[i]?.icon,
    name: localizedContent(s, "name", locale),
    color: defaultSubjects[i]?.color || "var(--color-primary-light)",
  })) || defaultSubjects;

  return (
    <section className="py-12 sm:py-20" style={{ backgroundColor: "var(--color-surface-alt)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 text-center animate-fade-in-up" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
          {localizedContent(c, "title", locale) || t("subjectsTitle")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {subjects.map((subj: any, i: number) => (
            <div key={i} className={`p-5 rounded-2xl text-center transition-all duration-300 hover:-translate-y-1 animate-fade-in-up delay-${(i + 1) * 100}`} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3" style={{ background: subj.color }}>
                <span className="text-2xl">{subj.icon}</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{subj.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

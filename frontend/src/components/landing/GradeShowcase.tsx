"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useApiList, usePrefetch } from "@/lib/useApi";
import { localizedContent } from "@/lib/i18n";

interface Grade { id: number; name?: string; translations: Record<string, Record<string, string>>; level: number; }

const gradeIcons = ["📚", "📐", "🔬", "🌍", "🎨", "📖"];
const gradeColors = ["var(--color-primary-light)", "var(--color-success-light)", "var(--color-accent-light)", "var(--color-warning-light)", "var(--color-error-light)"];

export default function GradeShowcase({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("academy");
  const tl = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { data: grades, loading } = useApiList<Grade>("/academics/grades/", { locale });
  const prefetch = usePrefetch(grades.map(() => `/academics/subjects/`));
  const c = content || {};

  useEffect(() => {
    if (grades.length === 0) return;
    const timer = setTimeout(prefetch, 600);
    return () => clearTimeout(timer);
  }, [grades, prefetch]);

  if (loading) return null;

  if (grades.length === 0) {
    return (
    <section className="py-12 sm:py-20" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{localizedContent(c, "title", locale) || tl("academyGradesTitle")}</h2>
        <div className="text-5xl sm:text-6xl mb-4">📚</div>
          <p style={{ color: "var(--color-text-muted)" }}>{t("noGrades")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-20" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-10 text-center animate-fade-in-up" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
          {localizedContent(c, "title", locale) || tl("academyGradesTitle")}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {grades.map((grade, i) => {
            const isCurriculum = pathname.includes("/curriculum");
            const href = isCurriculum ? `/${locale}/curriculum/${grade.id}` : `/${locale}/academy`;
            return (
            <Link key={grade.id} href={href} className="group p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)", animationDelay: `${i * 0.1}s` }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm" style={{ background: gradeColors[i % gradeColors.length] }}>
                <span className="text-2xl">{gradeIcons[i % gradeIcons.length]}</span>
              </div>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{typeof grade.name === "string" && grade.name ? grade.name : localizedContent(grade, "name", locale)}</h3>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("level")} {grade.level}</p>
            </Link>
          );})}
        </div>
      </div>
    </section>
  );
}

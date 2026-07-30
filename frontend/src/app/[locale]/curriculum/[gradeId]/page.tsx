"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useApiList, usePrefetch } from "@/lib/useApi";

interface Subject { id: number; name: string; icon: string; translations: Record<string, { name: string }>; }

export default function CurriculumGradeDetailPage() {
  const t = useTranslations("academy");
  const tc = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;
  const gradeId = params.gradeId as string;
  const { data: subjects, loading } = useApiList<Subject>("/academics/subjects/");
  const prefetch = usePrefetch(["/academics/curricula/"]);

  useEffect(() => {
    if (subjects.length === 0) return;
    const timer = setTimeout(prefetch, 600);
    return () => clearTimeout(timer);
  }, [subjects, prefetch]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/${locale}/curriculum`} className="transition-colors" style={{ color: "var(--color-primary)" }}>{locale === "ar" ? "المناهج الدراسية" : "Curriculum"}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "var(--color-text)" }}>{t("subjects")}</span>
        </nav>

        <h2 className="text-3xl font-bold mb-8" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {locale === "ar" ? "اختر المادة الدراسية للمنهاج" : "Select Curriculum Subject"}
        </h2>

        {loading ? (
          <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>{tc("loading")}</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("noSubjects")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/${locale}/curriculum/${gradeId}/${subject.id}`}
                className="group p-6 rounded-3xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-center"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="text-4xl mb-3">{subject.icon || "📚"}</div>
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                  {subject.translations?.[locale]?.name || subject.translations?.en?.name || subject.translations?.ar?.name || subject.name || ""}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

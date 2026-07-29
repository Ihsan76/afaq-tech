"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useApiList } from "@/lib/useApi";

interface Curriculum { id: number; name: Record<string, string>; country: string; year: number; }

export default function SubjectDetailPage() {
  const t = useTranslations("academy");
  const tc = useTranslations("common");
  const params = useParams();
  const locale = params.locale as string;
  const gradeId = params.gradeId as string;
  const subjectId = params.subjectId as string;
  const { data: curricula, loading } = useApiList<Curriculum>("/academics/curricula/");

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/${locale}/academy`} className="transition-colors" style={{ color: "var(--color-primary)" }}>{t("title")}</Link>
          <span>/</span>
          <Link href={`/${locale}/academy/${gradeId}`} className="transition-colors" style={{ color: "var(--color-primary)" }}>{t("subjects")}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "var(--color-text)" }}>{t("curricula")}</span>
        </nav>

        <h2 className="text-3xl font-bold mb-8" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("selectCurriculum")}</h2>

        {loading ? (
          <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>{tc("loading")}</span>
          </div>
        ) : curricula.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("noCurricula")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {curricula.map((curr) => (
              <Link key={curr.id} href={`/${locale}/academy/${gradeId}/${subjectId}?curriculum=${curr.id}`}
                className="group block p-5 rounded-3xl shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                  {curr.name?.[locale] || curr.name?.en || curr.name?.ar || ""}
                </h3>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{curr.country} — {curr.year}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

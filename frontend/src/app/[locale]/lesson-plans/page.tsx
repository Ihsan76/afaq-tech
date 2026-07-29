"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

interface LessonPlan { id: number; title: string; status: string; created_at: string; }

export default function LessonPlansPage() {
  const t = useTranslations("lessonPlan");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lesson-plans/").then((res) => setPlans(res.data.results || res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusStyle = (s: string) => {
    if (s === "draft") return { bg: "var(--color-warning-light)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" };
    if (s === "published") return { bg: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" };
    return { bg: "var(--color-background-secondary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" };
  };

  const statusLabel = (s: string) => {
    if (s === "draft") return t("draft");
    if (s === "published") return t("published");
    return t("archived");
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("myPlans")}</h1>
            <p style={{ color: "var(--color-text-muted)" }}>{t("title")}</p>
          </div>
          <Link href={`/${locale}/lesson-plans/new`}
            className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md flex items-center gap-2"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            <span>+</span> {t("create")}
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>{t("loading")}</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-3xl shadow-xl p-16 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="text-6xl mb-4">📝</div>
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("noPlans")}</p>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>{t("startCreating")}</p>
            <Link href={`/${locale}/lesson-plans/new`}
              className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
              {t("generate")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Link key={plan.id} href={`/${locale}/lesson-plans/${plan.id}`}
                className="group block p-5 rounded-3xl shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{plan.title}</h3>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{new Date(plan.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={statusStyle(plan.status)}>
                    {statusLabel(plan.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

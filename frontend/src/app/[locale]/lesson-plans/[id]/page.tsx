"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

interface LessonPlan { id: number; title: string; plan_data: any; status: string; created_at: string; updated_at: string; }

export default function LessonPlanDetailPage() {
  const t = useTranslations("lessonPlan");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const planId = params.id as string;
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/lesson-plans/${planId}/`).then((res) => setPlan(res.data)).catch(() => router.push(`/${locale}/lesson-plans`)).finally(() => setLoading(false));
  }, [planId, locale, router]);

  const handleDuplicate = async () => {
    try { const { data } = await api.post(`/lesson-plans/${planId}/duplicate/`); router.push(`/${locale}/lesson-plans/${data.id}`); } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span>{tc("loading")}</span>
      </div>
    </div>
  );
  if (!plan) return null;

  const statusStyle = () => {
    if (plan.status === "draft") return { bg: "var(--color-warning-light)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" };
    if (plan.status === "published") return { bg: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" };
    return { bg: "var(--color-background-secondary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" };
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Link href={`/${locale}/lesson-plans`} className="transition-colors" style={{ color: "var(--color-primary)" }}>{t("title")}</Link>
            <span>/</span>
            <span className="font-medium truncate max-w-[200px]" style={{ color: "var(--color-text)" }}>{plan.title}</span>
          </div>
          <button onClick={handleDuplicate}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" }}>
            📋 {t("copyPlan")}
          </button>
        </nav>

        <div className="p-8 rounded-3xl shadow-xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <h1 className="text-3xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{plan.title}</h1>

          <div className="flex items-center gap-3 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={statusStyle()}>
              {t("status")}: {plan.status === "draft" ? t("draft") : plan.status}
            </span>
            <span>•</span>
            <span>{new Date(plan.created_at).toLocaleDateString()}</span>
          </div>

          <div className="pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
            {typeof plan.plan_data === "object" && plan.plan_data.prompt ? (
              <div>
                <h3 className="text-lg font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("description")}</h3>
                <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{plan.plan_data.prompt}</p>
              </div>
            ) : (
              <pre className="p-4 rounded-2xl text-sm overflow-auto" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
                {JSON.stringify(plan.plan_data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

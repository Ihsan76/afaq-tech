"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface MarketplacePlan {
  id: number;
  title: string;
  subject_name: string;
  grade_name: string;
  likes_count: number;
  clones_count: number;
  created_at: string;
  ai_model_used: string;
  user_name: string;
}

export default function MarketplacePage() {
  const t = useTranslations("lessonPlan");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/lesson-plans/marketplace/").then((res) => setPlans(res.data.results || res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleClone = async (id: number) => {
    try {
      const { data } = await api.post(`/lesson-plans/${id}/clone/`);
      router.push(`/${locale}/lesson-plans/${data.id}`);
    } catch {}
  };

  const handleLike = async (id: number) => {
    try {
      await api.post(`/lesson-plans/${id}/like/`);
      setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, likes_count: p.likes_count + 1 } : p)));
    } catch {}
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("marketplace")}</h1>
            <p style={{ color: "var(--color-text-muted)" }}>{t("marketplaceDesc")}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>{t("loading")}</span>
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-3xl shadow-xl p-16 text-center" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="text-6xl mb-4">🏪</div>
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("noPublicPlans")}</p>
            <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>{t("shareHint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <FadeIn key={plan.id} delay={idx * 80} direction="up">
                <div
                  className="p-6 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <Link href={`/${locale}/lesson-plans/${plan.id}`}>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{plan.title}</h3>
                </Link>
                <div className="space-y-1.5 mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <p>{t("subject")}: {plan.subject_name}</p>
                  <p>{t("grade")}: {plan.grade_name}</p>
                  <p>{t("aiModel")}: {plan.ai_model_used}</p>
                  <p>{t("byTeacher")}: {plan.user_name}</p>
                  <p>{new Date(plan.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4 text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  <span>👍 {plan.likes_count}</span>
                  <span>📋 {plan.clones_count}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleLike(plan.id)}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold transition-all text-sm"
                    style={{ background: "var(--btn-secondary-bg)", color: "var(--btn-secondary-color)", border: "1px solid var(--color-border)" }}>
                    {t("likes")}
                  </button>
                  <button onClick={() => handleClone(plan.id)}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold transition-all text-sm text-white"
                    style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
                    {t("clone")}
                  </button>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

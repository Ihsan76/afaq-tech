"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import FadeIn from "@/components/FadeIn";

interface Plan {
  id: number;
  code: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  billing_period: string;
  duration_days: number;
  level: number;
  features: string[];
  is_featured: boolean;
}

interface Subscription {
  id: number;
  plan: number;
  plan_name: string;
  status: string;
  price_paid: string;
  currency: string;
  start_at: string | null;
  end_at: string | null;
  paid_at: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#d1fae5", color: "#059669" },
  pending: { bg: "#fef3c7", color: "#d97706" },
  expired: { bg: "#fee2e2", color: "#dc2626" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
  refunded: { bg: "#f3e8ff", color: "#7c3aed" },
};

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";
  const accessToken = useAuthStore((s) => s.accessToken);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCurrent = useCallback(() => {
    if (!accessToken) return;
    api.get("/subscriptions/current/")
      .then(r => {
        const data = r.data;
        if (data && data.id) setCurrent(data);
      })
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("session_id") || params.get("paymentId")) {
      setBanner({ type: "success", text: t("paymentSuccess") });
      window.history.replaceState({}, "", window.location.pathname);
      fetchCurrent();
    } else if (params.get("cancelled")) {
      setBanner({ type: "error", text: t("paymentCancelled") });
      window.history.replaceState({}, "", window.location.pathname);
    }
    api.get(`/subscriptions/plans/?locale=${locale}`)
      .then(r => setPlans(r.data))
      .catch(() => {});
    fetchCurrent();
    setLoading(false);
  }, [locale, fetchCurrent, t]);

  const handleBuy = async (plan: Plan) => {
    if (!accessToken) {
      router.push(`/${locale}/login`);
      return;
    }
    setBuying(plan.id);
    try {
      const res = await api.post("/subscriptions/purchase/", { plan_id: plan.id, locale });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setBanner({ type: "error", text: t("paymentNotAvailable") });
    } catch (err: any) {
      const detail = err?.response?.data;
      const message = detail?.plan_id?.[0] || t("paymentNotAvailable");
      setBanner({ type: "error", text: message });
    } finally {
      setBuying(null);
    }
  };

  const surfaceCls = "rounded-3xl shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("title")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("subtitle")}</p>
          </div>
        </div>

        {banner && (
          <div className="mb-6 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2"
            style={{
              background: banner.type === "success" ? "var(--color-success)" : "var(--color-error)",
              color: "#FFF",
            }}>
            {banner.type === "success" ? "✅" : "⚠️"} {banner.text}
          </div>
        )}

        {current && (
          <div className={surfaceCls + " p-5 mb-8"} style={surfaceStyle}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{t("currentPlan")}</p>
                <h3 className="text-xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{current.plan_name}</h3>
                {current.end_at && (
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("validUntil")}: {new Date(current.end_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: (STATUS_COLORS[current.status] || STATUS_COLORS.pending).bg, color: (STATUS_COLORS[current.status] || STATUS_COLORS.pending).color }}>
                {t(current.status)}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
            {plans.map((plan, idx) => {
              const featured = plan.is_featured;
              const free = Number(plan.price) <= 0;
              return (
                <FadeIn key={plan.id} delay={idx * 80} direction="up">
                  <div className={`relative p-6 sm:p-8 rounded-3xl flex flex-col h-full transition-all duration-300 ${featured ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                    style={{ background: "var(--color-surface)", border: featured ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", boxShadow: featured ? "0 0 0 4px var(--color-primary-light), var(--card-shadow)" : "var(--card-shadow)" }}>
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                        {t("popular")}
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>{plan.description}</p>
                    )}
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-4xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{plan.currency} / {t(plan.billing_period)}</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          <span className="text-[var(--color-success)]">✓</span>{feat}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleBuy(plan)}
                      disabled={free || buying === plan.id}
                      className={`block w-full text-center py-3 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-40 ${featured ? 'hover:shadow-lg hover:-translate-y-0.5' : 'hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]'}`}
                      style={featured ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", color: "white", boxShadow: "var(--btn-shadow)" } : { border: "2px solid var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
                      {free ? t("freePlan") : buying === plan.id ? t("redirecting") : t("subscribeNow")}
                    </button>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

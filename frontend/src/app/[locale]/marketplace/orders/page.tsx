"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface OrderItem {
  id: number; service: number; service_title: string;
  provider_name: string; status: string;
  price_paid: string; currency: string;
  notes: string; scheduled_at: string | null;
  completed_at: string | null; created_at: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#fef3c7", color: "#d97706" },
  confirmed: { bg: "#dbeafe", color: "#2563eb" },
  in_progress: { bg: "#e0f2fe", color: "#0284c7" },
  completed: { bg: "#d1fae5", color: "#059669" },
  cancelled: { bg: "#fee2e2", color: "#dc2626" },
  refunded: { bg: "#f3e8ff", color: "#7c3aed" },
};

export default function OrdersPage() {
  const t = useTranslations("servicesMarketplace");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"buyer" | "provider">("buyer");

  useEffect(() => {
    api.get(`/marketplace/orders/?role=${role}`)
      .then(r => setOrders(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

  const handleCancel = async (id: number) => {
    try {
      await api.post(`/marketplace/orders/${id}/cancel/`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
    } catch {}
  };

  const handleComplete = async (id: number) => {
    try {
      await api.post(`/marketplace/orders/${id}/complete/`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "completed" } : o));
    } catch {}
  };

  const surfaceCls = "rounded-3xl shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("myOrders")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("myOrdersDesc")}</p>
          </div>
          <button onClick={() => router.push(`/${locale}/marketplace`)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
            ← {t("title")}
          </button>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          {(["buyer", "provider"] as const).map(r => (
            <button key={r} onClick={() => setRole(r)}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: role === r ? "var(--color-primary)" : "transparent", color: role === r ? "#FFF" : "var(--color-text-secondary)" }}>
              {r === "buyer" ? t("buyer") : t("provider")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          </div>
        ) : orders.length === 0 ? (
          <div className={surfaceCls + " p-16 text-center"} style={surfaceStyle}>
            <div className="text-6xl mb-4">📋</div>
            <p className="text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("noOrders")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => {
              const sc = STATUS_COLORS[order.status] || { bg: "#f1f5f9", color: "#64748b" };
              return (
                <FadeIn key={order.id} delay={idx * 60} direction="up">
                  <div className={surfaceCls + " p-5"} style={surfaceStyle}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{order.service_title}</h3>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {role === "buyer" ? `${t("provider")}: ${order.provider_name}` : ""}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                        style={{ background: sc.bg, color: sc.color }}>
                        {t(order.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="font-bold" style={{ color: "var(--color-primary)" }}>{order.price_paid} {order.currency}</span>
                      <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                      {order.scheduled_at && <span>⏰ {new Date(order.scheduled_at).toLocaleString()}</span>}
                    </div>
                    {order.notes && <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>📝 {order.notes}</p>}
                    <div className="flex gap-2">
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <button onClick={() => handleCancel(order.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "var(--color-surface-alt)", color: "var(--color-error)" }}>
                          {t("cancelled")}
                        </button>
                      )}
                      {order.status === "in_progress" && role === "provider" && (
                        <button onClick={() => handleComplete(order.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                          style={{ background: "var(--color-success)" }}>
                          {t("completed")}
                        </button>
                      )}
                    </div>
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

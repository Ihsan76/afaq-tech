"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface Category { id: number; name: Record<string, string>; icon: string; }

interface ServiceItem {
  id: number; provider: number; provider_name: string;
  category: number | null; category_name: string;
  title: Record<string, string>;
  service_type: string; price: string; currency: string;
  duration_minutes: number; is_online: boolean;
  sales_count: number; rating_avg: string; rating_count: number;
  is_featured: boolean; created_at: string;
}

const FALLBACK_ICONS: Record<string, string> = {
  tutoring: "📚", course: "🎓", consultation: "💡", other: "🔧",
};

export default function MarketplacePage() {
  const t = useTranslations("servicesMarketplace");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "en";

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    api.get("/marketplace/categories/").then(r => setCategories(r.data.results || r.data)).catch(() => {});
    fetchServices();
  }, []);

  const fetchServices = (cat?: number | null, type?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cat ?? selectedCat) params.set("category", String(cat ?? selectedCat));
    if (type ?? selectedType) params.set("service_type", type ?? selectedType);
    api.get(`/marketplace/services/?${params}`).then(r => setServices(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const selectCategory = (catId: number | null) => {
    setSelectedCat(catId);
    fetchServices(catId, undefined);
  };

  const selectType = (type: string) => {
    const next = type === selectedType ? "" : type;
    setSelectedType(next);
    fetchServices(undefined, next);
  };

  const SERVICE_TYPES = [
    { key: "tutoring", label: t("tutoring") },
    { key: "course", label: t("course") },
    { key: "consultation", label: t("consultation") },
    { key: "other", label: t("other") },
  ];

  const surfaceCls = "rounded-3xl shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("title")}</h1>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("subtitle")}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push(`/${locale}/marketplace/orders`)}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
              {t("myOrders")}
            </button>
            <button onClick={() => router.push(`/${locale}/marketplace/services/create`)}
              className="text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
              + {t("provideService")}
            </button>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("categories")}</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => selectCategory(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCat === null ? "text-white shadow-md" : ""}`}
                style={{ background: selectedCat === null ? "var(--color-primary)" : "var(--color-surface)", color: selectedCat === null ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                {t("allCategories")}
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => selectCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCat === cat.id ? "text-white shadow-md" : ""}`}
                  style={{ background: selectedCat === cat.id ? "var(--color-primary)" : "var(--color-surface)", color: selectedCat === cat.id ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                  {cat.icon} {cat.name?.[locale] || cat.name?.ar || cat.name?.en || ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Service Type Filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          {SERVICE_TYPES.map(st => (
            <button key={st.key} onClick={() => selectType(st.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedType === st.key ? "text-white" : ""}`}
              style={{ background: selectedType === st.key ? "var(--color-primary)" : "var(--color-surface-alt)", color: selectedType === st.key ? "#FFF" : "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>
              {FALLBACK_ICONS[st.key]} {st.label}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16" style={{ color: "var(--color-text-muted)" }}>
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>جاري التحميل...</span>
          </div>
        ) : services.length === 0 ? (
          <div className={surfaceCls + " p-16 text-center"} style={surfaceStyle}>
            <div className="text-6xl mb-4">🏪</div>
            <p className="text-lg font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("noServices")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc, idx) => {
              const title = svc.title?.[locale] || svc.title?.ar || svc.title?.en || "";
              const typeIcon = FALLBACK_ICONS[svc.service_type] || "🔧";
              return (
                <FadeIn key={svc.id} delay={idx * 60} direction="up">
                  <div className={surfaceCls + " p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer"} style={surfaceStyle}
                    onClick={() => router.push(`/${locale}/marketplace/services/${svc.id}`)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{typeIcon}</span>
                        <div>
                          <h3 className="font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h3>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{svc.provider_name}</p>
                        </div>
                      </div>
                      {svc.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "var(--color-warning)" }}>⭐</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="font-bold" style={{ color: "var(--color-primary)" }}>{svc.price} {svc.currency}</span>
                      <span>⏱ {svc.duration_minutes} {t("minutes")}</span>
                      <span>{svc.is_online ? "🌐" : "📍"} {svc.is_online ? t("online") : t("inPerson")}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <span>📊 {svc.sales_count} {t("sales")}</span>
                      <span>⭐ {svc.rating_avg || "0.0"} ({svc.rating_count})</span>
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

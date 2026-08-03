"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface AvailabilitySlot {
  id: number; day_of_week: number;
  start_time: string; end_time: string;
}

interface ReviewItem {
  id: number; reviewer_name: string;
  rating: number; comment: string; created_at: string;
}

interface ServiceDetail {
  id: number; provider: number; category: number | null;
  title: Record<string, string>;
  description: Record<string, string>;
  service_type: string; price: string; currency: string;
  duration_minutes: number; is_online: boolean;
  location: string; max_students: number;
  sales_count: number; rating_avg: string; rating_count: number;
  availability: AvailabilitySlot[];
  reviews: ReviewItem[];
  created_at: string;
}

const DAY_NAMES: Record<string, string[]> = {
  ar: ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};

const FALLBACK_ICONS: Record<string, string> = {
  tutoring: "📚", course: "🎓", consultation: "💡", other: "🔧",
};

export default function ServiceDetailPage() {
  const t = useTranslations("servicesMarketplace");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";
  const serviceId = params.id as string;

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    api.get(`/marketplace/services/${serviceId}/`)
      .then(r => setService(r.data))
      .catch(() => router.push(`/${locale}/marketplace`))
      .finally(() => setLoading(false));
  }, [serviceId]);

  const handleOrder = async () => {
    setOrdering(true); setOrderError("");
    try {
      const res = await api.post("/marketplace/orders/", { service: Number(serviceId), notes, locale });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setOrderDone(true);
      if (res.data?.payment_available === false) {
        setOrderError(t("paymentNotAvailable"));
      }
    } catch (e: any) {
      setOrderError(e.response?.data?.detail || e.response?.data || "حدث خطأ");
    } finally { setOrdering(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="animate-spin h-8 w-8 border-4 rounded-full" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
    </div>
  );
  if (!service) return null;

  const title = service.title?.[locale] || service.title?.ar || service.title?.en || "";
  const description = service.description?.[locale] || service.description?.ar || service.description?.en || "";
  const days = DAY_NAMES[locale] || DAY_NAMES.en;
  const typeIcon = FALLBACK_ICONS[service.service_type] || "🔧";

  const surfaceCls = "rounded-3xl shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => router.back()} className="text-sm font-medium mb-4 transition-colors" style={{ color: "var(--color-primary)" }}>
          ← {locale === "ar" ? "العودة" : "Back"}
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <FadeIn direction="up">
              <div className={surfaceCls + " p-6 lg:p-8"} style={surfaceStyle}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{typeIcon}</span>
                  <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h1>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{service.service_type}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mb-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <span className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>{service.price} {service.currency}</span>
                  <span>⏱ {service.duration_minutes} {t("minutes")}</span>
                  <span>{service.is_online ? "🌐" : "📍"} {service.is_online ? t("online") : t("inPerson")}</span>
                  {!service.is_online && service.location && <span>📍 {service.location}</span>}
                  <span>👥 {service.max_students}</span>
                  <span>📊 {service.sales_count} {t("sales")}</span>
                  <span>⭐ {service.rating_avg || "0.0"} ({service.rating_count} {t("reviews")})</span>
                </div>
                <div className="prose prose-sm max-w-none" style={{ color: "var(--color-text-secondary)" }}>
                  {description || <p className="italic" style={{ color: "var(--color-text-muted)" }}>لا يوجد وصف</p>}
                </div>
              </div>
            </FadeIn>

            {/* Availability */}
            {service.availability.length > 0 && (
              <FadeIn direction="up" delay={100}>
                <div className={surfaceCls + " p-6"} style={surfaceStyle}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("scheduledAt")}</h2>
                  <div className="space-y-2">
                    {service.availability.map(slot => (
                      <div key={slot.id} className="flex items-center gap-3 text-sm px-4 py-2 rounded-xl" style={{ background: "var(--color-surface-alt)" }}>
                        <span className="font-medium" style={{ color: "var(--color-text)" }}>{days[slot.day_of_week] || `Day ${slot.day_of_week}`}</span>
                        <span style={{ color: "var(--color-text-muted)" }}>{slot.start_time} - {slot.end_time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Reviews */}
            {service.reviews.length > 0 && (
              <FadeIn direction="up" delay={150}>
                <div className={surfaceCls + " p-6"} style={surfaceStyle}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("reviews")}</h2>
                  <div className="space-y-4">
                    {service.reviews.map(r => (
                      <div key={r.id} className="pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{r.reviewer_name}</span>
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs mb-1" style={{ color: "var(--color-warning)" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                        {r.comment && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}
          </div>

          {/* Booking Panel */}
          <div>
            <FadeIn direction="up" delay={80}>
              <div className={surfaceCls + " p-6 sticky top-24"} style={surfaceStyle}>
                {orderDone ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✅</div>
                    <p className="font-bold mb-1" style={{ color: "var(--color-text)" }}>{t("paymentPending")}</p>
                    <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{t("pending")}</p>
                    {orderError && <p className="text-xs mb-4" style={{ color: "var(--color-warning)" }}>{typeof orderError === "string" ? orderError : JSON.stringify(orderError)}</p>}
                    <button onClick={() => router.push(`/${locale}/marketplace/orders`)}
                      className="w-full px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all"
                      style={{ background: "var(--btn-primary-bg)" }}>
                      {t("myOrders")}
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                      {service.price} {service.currency}
                    </h2>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("notes")}</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-background)" }}
                          rows={3} placeholder="أي ملاحظات إضافية..." />
                      </div>
                      {orderError && <p className="text-xs" style={{ color: "var(--color-error)" }}>{typeof orderError === "string" ? orderError : JSON.stringify(orderError)}</p>}
                      <button onClick={handleOrder} disabled={ordering}
                        className="w-full px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "var(--btn-primary-bg)" }}>
                        {ordering ? t("redirecting") : t("orderNow")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>
  );
}

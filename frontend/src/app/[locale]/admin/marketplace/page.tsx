"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface AdminService {
  id: number;
  provider_name: string;
  category_name: string;
  title: Record<string, string>;
  service_type: string;
  price: string;
  currency: string;
  status: string;
  is_featured: boolean;
  created_at: string;
}

interface AdminCategory {
  id: number;
  name: Record<string, string>;
  icon: string;
  is_active: boolean;
}

interface AdminOrder {
  id: number;
  buyer_name: string;
  buyer_email: string;
  service_title: string;
  provider_name: string;
  price_paid: string;
  currency: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
}

interface AdminReview {
  id: number;
  reviewer_name: string;
  service: number;
  service_title?: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

const SERVICE_STATUSES = ["draft", "published", "archived"];
const ORDER_STATUSES = ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded"];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  published: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  archived: { bg: "#fef3c7", color: "#d97706" },
  pending: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  confirmed: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)" },
  in_progress: { bg: "var(--color-accent-light)", color: "var(--color-accent)" },
  completed: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  cancelled: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  refunded: { bg: "var(--color-error-light, #fee2e2)", color: "var(--color-error)" },
};

type Tab = "services" | "categories" | "orders" | "reviews";

export default function AdminMarketplacePage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("services");

  const [services, setServices] = useState<AdminService[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [newCatAr, setNewCatAr] = useState("");
  const [newCatEn, setNewCatEn] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search && (tab === "orders" || tab === "services")) params.set("search", search);
      const url = tab === "orders"
        ? `/marketplace/admin/orders/?${params.toString()}`
        : tab === "categories"
          ? "/marketplace/admin/categories/"
          : tab === "reviews"
            ? "/marketplace/admin/reviews/"
            : `/marketplace/admin/services/?${params.toString()}`;
      const res = await api.get(url);
      const list = res.data.results || res.data || [];
      if (tab === "services") setServices(list);
      else if (tab === "categories") setCategories(list);
      else if (tab === "orders") setOrders(list);
      else setReviews(list);
    } catch {} finally { setIsLoading(false); }
  }, [tab, statusFilter, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateService = async (service: AdminService, patch: Partial<AdminService>) => {
    try {
      await api.patch(`/marketplace/admin/services/${service.id}/`, patch);
      setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, ...patch } : s)));
    } catch {}
  };

  const updateOrder = async (order: AdminOrder, status: string) => {
    try {
      await api.patch(`/marketplace/admin/orders/${order.id}/`, { status });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    } catch {}
  };

  const updateReview = async (review: AdminReview, is_approved: boolean) => {
    try {
      await api.patch(`/marketplace/admin/reviews/${review.id}/`, { is_approved });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, is_approved } : r)));
    } catch {}
  };

  const updateCategory = async (cat: AdminCategory, patch: Partial<AdminCategory>) => {
    try {
      await api.patch(`/marketplace/admin/categories/${cat.id}/`, patch);
      setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, ...patch } : c)));
    } catch {}
  };

  const deleteService = async (id: number) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    try { await api.delete(`/marketplace/admin/services/${id}/`); setServices((prev) => prev.filter((s) => s.id !== id)); } catch {}
  };

  const deleteCategory = async (id: number) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    try { await api.delete(`/marketplace/admin/categories/${id}/`); setCategories((prev) => prev.filter((c) => c.id !== id)); } catch {}
  };

  const addCategory = async () => {
    if (!newCatAr && !newCatEn) return;
    try {
      await api.post("/marketplace/admin/categories/", {
        name: { ar: newCatAr, en: newCatEn || newCatAr },
        icon: newCatIcon,
        is_active: true,
      });
      setNewCatAr(""); setNewCatEn(""); setNewCatIcon("");
      fetchAll();
    } catch {}
  };

  const title = (obj: Record<string, string> | undefined, fallback: string) =>
    obj?.[locale] || obj?.en || obj?.ar || fallback;

  const selectCls = "px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer";
  const inputCls = "px-4 py-2 rounded-xl text-sm border";
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "services", label: t("admin.tabServices"), icon: "🏪" },
    { key: "categories", label: t("admin.tabCategories"), icon: "🗂️" },
    { key: "orders", label: t("admin.tabOrders"), icon: "🛒" },
    { key: "reviews", label: t("admin.tabReviews"), icon: "⭐" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.marketplace")}
        </h1>
        <div className="flex flex-wrap gap-2">
          {(tab === "services" || tab === "orders") && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAll()}
              placeholder={t("admin.searchPlaceholder")}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            />
          )}
          {tab === "services" && (
            <SelectDropdown value={statusFilter} onChange={(v) => setStatusFilter(String(v))} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
              <option value="">{t("admin.allStatuses")}</option>
              {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{t(`servicesMarketplace.${s}`)}</option>)}
            </SelectDropdown>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setStatusFilter(""); setSearch(""); }}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === tb.key
              ? { background: "var(--color-primary)", color: "#fff", boxShadow: "var(--card-shadow)" }
              : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
          >
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {/* Categories: add form */}
      {tab === "categories" && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-4 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <input value={newCatAr} onChange={(e) => setNewCatAr(e.target.value)} placeholder={t("admin.categoryNameAr")} className={inputCls} style={{ background: "var(--color-background)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
          <input value={newCatEn} onChange={(e) => setNewCatEn(e.target.value)} placeholder={t("admin.categoryNameEn")} className={inputCls} style={{ background: "var(--color-background)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
          <input value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)} placeholder="🎓" className={`${inputCls} w-16`} style={{ background: "var(--color-background)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
          <button onClick={addCategory} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>
            {t("admin.addCategory")}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                {tab === "services" && (
                  <>
                    <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.title")}</th>
                    <th className="col-hide-md px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.provider")}</th>
                    <th className="col-hide-md px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.categories")}</th>
                    <th className="col-hide-sm px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.price")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.statusCol")}</th>
                    <th className="col-hide-md px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featuredCol")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.actionsCol")}</th>
                  </>
                )}
                {tab === "categories" && (
                  <>
                    <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.categories")}</th>
                    <th className="col-hide-sm px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.iconCol")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.active")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.actionsCol")}</th>
                  </>
                )}
                {tab === "orders" && (
                  <>
                    <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.orderIdCol")}</th>
                    <th className="col-hide-md px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.buyer")}</th>
                    <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.title")}</th>
                    <th className="col-hide-sm px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.price")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.statusCol")}</th>
                    <th className="col-hide-lg px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("dashboard.memberSince")}</th>
                  </>
                )}
                {tab === "reviews" && (
                  <>
                    <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.reviews")}</th>
                    <th className="col-hide-md px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("servicesMarketplace.title")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.ratingCol")}</th>
                    <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.approvedCol")}</th>
                    <th className="col-hide-lg px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("dashboard.memberSince")}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === "services" && services.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.noServicesFound")}</td></tr>
              )}
              {tab === "services" && services.map((s) => {
                const sc = STATUS_COLORS[s.status] || STATUS_COLORS.draft;
                return (
                  <tr key={s.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{title(s.title, `#${s.id}`)}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{s.service_type}</div>
                    </td>
                    <td className="col-hide-md px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.provider_name}</td>
                    <td className="col-hide-md px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.category_name || "—"}</td>
                    <td className="col-hide-sm px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text)" }}>{s.price} {s.currency}</td>
                    <td className="px-6 py-4 text-center">
                      <SelectDropdown value={s.status} onChange={(v) => updateService(s, { status: String(v) })} size="sm" triggerStyle={{ background: sc.bg, color: sc.color, borderColor: sc.color }}>
                        {SERVICE_STATUSES.map((st) => <option key={st} value={st}>{t(`servicesMarketplace.${st}`)}</option>)}
                      </SelectDropdown>
                    </td>
                    <td className="col-hide-md px-6 py-4 text-center">
                      <button onClick={() => updateService(s, { is_featured: !s.is_featured })} className={`px-3 py-1 rounded-full text-xs font-bold ${s.is_featured ? "text-white" : ""}`} style={s.is_featured ? { background: "var(--color-warning)" } : { background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                        {s.is_featured ? t("admin.featuredYes") : t("admin.featuredNo")}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => deleteService(s.id)} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "var(--color-error-light, #fee2e2)", color: "var(--color-error)" }}>{t("admin.delete")}</button>
                    </td>
                  </tr>
                );
              })}

              {tab === "categories" && categories.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.noCategories")}</td></tr>
              )}
              {tab === "categories" && categories.map((c) => (
                <tr key={c.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{title(c.name, `#${c.id}`)}</div>
                    {c.name?.en && c.name?.ar && c.name.en !== c.name.ar && (
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.name.en} / {c.name.ar}</div>
                    )}
                  </td>
                  <td className="col-hide-sm px-6 py-4 text-center text-lg">{c.icon || "🗂️"}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => updateCategory(c, { is_active: !c.is_active })} className={`px-3 py-1 rounded-full text-xs font-bold ${c.is_active ? "text-white" : ""}`} style={c.is_active ? { background: "var(--color-success)" } : { background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                      {c.is_active ? t("admin.active") : t("admin.inactive")}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => deleteCategory(c.id)} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "var(--color-error-light, #fee2e2)", color: "var(--color-error)" }}>{t("admin.delete")}</button>
                  </td>
                </tr>
              ))}

              {tab === "orders" && orders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.noOrdersFound")}</td></tr>
              )}
              {tab === "orders" && orders.map((o) => {
                const oc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                return (
                  <tr key={o.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-6 py-4 font-bold text-sm" style={{ color: "var(--color-text)" }}>#{o.id}</td>
                    <td className="col-hide-md px-6 py-4">
                      <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{o.buyer_name}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{o.buyer_email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>{o.service_title}</td>
                    <td className="col-hide-sm px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text)" }}>{o.price_paid} {o.currency}</td>
                    <td className="px-6 py-4 text-center">
                       <SelectDropdown value={o.status} onChange={(v) => updateOrder(o, String(v))} size="sm" triggerStyle={{ background: oc.bg, color: oc.color, borderColor: oc.color }}>
                        {ORDER_STATUSES.map((st) => <option key={st} value={st}>{t(`servicesMarketplace.${st}`)}</option>)}
                      </SelectDropdown>
                    </td>
                    <td className="col-hide-lg px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                    </td>
                  </tr>
                );
              })}

              {tab === "reviews" && reviews.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.noReviews")}</td></tr>
              )}
              {tab === "reviews" && reviews.map((r) => (
                <tr key={r.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{r.reviewer_name}</div>
                    <div className="text-xs max-w-[260px] truncate" style={{ color: "var(--color-text-muted)" }}>{r.comment || "—"}</div>
                  </td>
                  <td className="col-hide-md px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{r.service_title || `#${r.service}`}</td>
                  <td className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-warning)" }}>{"★".repeat(Math.min(5, Math.max(0, r.rating)))}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => updateReview(r, !r.is_approved)} className={`px-3 py-1 rounded-full text-xs font-bold ${r.is_approved ? "text-white" : ""}`} style={r.is_approved ? { background: "var(--color-success)" } : { background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                      {r.is_approved ? t("admin.approvedYes") : t("admin.approvedNo")}
                    </button>
                  </td>
                  <td className="col-hide-lg px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
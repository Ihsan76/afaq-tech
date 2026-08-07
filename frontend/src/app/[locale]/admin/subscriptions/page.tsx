"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";

interface AdminPlan {
  id: number;
  code: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price: string;
  currency: string;
  prices: Record<string, string>;
  billing_period: string;
  duration_days: number;
  level: number;
  features: (string | Record<string, string>)[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface PlanServiceItem {
  id: number;
  code: string;
  name: Record<string, string>;
  sort_order: number;
  is_active: boolean;
}

interface PlanServiceRow {
  code: string;
  limit: string;
  period: string;
}

interface AdminCurrency {
  id: number;
  code: string;
  name: Record<string, string>;
  symbol: string;
  rate: string;
  is_base: boolean;
  is_active: boolean;
  sort_order: number;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

export default function AdminSubscriptionsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name, rtl: l.is_rtl }));

  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [catalog, setCatalog] = useState<PlanServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [error, setError] = useState("");
  const [serviceError, setServiceError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [selectedLang, setSelectedLang] = useState("ar");
  const [nameTranslations, setNameTranslations] = useState<Record<string, string>>({});
  const [descTranslations, setDescTranslations] = useState<Record<string, string>>({});
  const [featuresByLang, setFeaturesByLang] = useState<Record<string, string>>({});

  const [code, setCode] = useState("");
  const [basePrice, setBasePrice] = useState("0.00");
  const [baseCurrency, setBaseCurrency] = useState("SAR");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [durationDays, setDurationDays] = useState(30);
  const [level, setLevel] = useState(0);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [planServices, setPlanServices] = useState<PlanServiceRow[]>([]);
  const [selectedServiceCode, setSelectedServiceCode] = useState("");
  const [newServiceCode, setNewServiceCode] = useState("");
  const [newServiceNameAr, setNewServiceNameAr] = useState("");
  const [newServiceNameEn, setNewServiceNameEn] = useState("");

  const [currencies, setCurrencies] = useState<AdminCurrency[]>([]);
  const [rateEdits, setRateEdits] = useState<Record<number, string>>({});
  const [currencyError, setCurrencyError] = useState("");
  const [currencyForm, setCurrencyForm] = useState({ code: "", name_ar: "", name_en: "", symbol: "", rate: "" });
  const [currencyIsBase, setCurrencyIsBase] = useState(false);
  const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(null);

  useEffect(() => { fetchPlans(); fetchCatalog(); fetchCurrencies(); }, []);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      if (!window.confirm(t("admin.unsavedChanges"))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, t]);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/subscriptions/admin/plans/");
      setPlans(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const fetchCatalog = async () => {
    try {
      const res = await api.get("/subscriptions/admin/services/");
      setCatalog(res.data.results || res.data);
    } catch {}
  };

  const fetchCurrencies = async () => {
    try {
      const res = await api.get("/subscriptions/admin/currencies/");
      setCurrencies(res.data.results || res.data);
    } catch {}
  };

  const rateOf = (code: string): number => {
    const c = currencies.find((x) => x.code === code);
    const raw = c ? Number(c.rate) : NaN;
    return Number.isFinite(raw) ? raw : NaN;
  };

  const computedPrice = (code: string): string | null => {
    const rate = rateOf(code);
    const base = Number(basePrice);
    if (!Number.isFinite(rate) || rate <= 0 || !Number.isFinite(base)) return null;
    return (base * rate).toFixed(2);
  };

  const langName = (langCode: string) => LANGUAGES.find((l) => l.code === langCode)?.label || langCode;

  const resetForm = (open = false) => {
    setSelectedLang("ar");
    setNameTranslations({});
    setDescTranslations({});
    setFeaturesByLang({});
    setCode(""); setBasePrice("0.00"); setBaseCurrency("JOD"); setPrices({});
    setBillingPeriod("monthly"); setDurationDays(30); setLevel(0); setSortOrder(0);
    setIsActive(true); setIsFeatured(false);
    setPlanServices([]); setSelectedServiceCode("");
    setEditingPlan(null); setError(""); setIsDirty(false); setShowForm(open);
  };

  const startEdit = async (plan: AdminPlan) => {
    const names: Record<string, string> = {};
    const descs: Record<string, string> = {};
    const feats: Record<string, string> = {};
    for (const l of LANGUAGES) {
      if (plan.name?.[l.code]) names[l.code] = plan.name[l.code];
      if (plan.description?.[l.code]) descs[l.code] = plan.description[l.code];
      feats[l.code] = (plan.features || [])
        .map((f) => typeof f === "string" ? f : f[l.code] || f.en || f.ar || "")
        .join("\n");
    }
    setNameTranslations(names);
    setDescTranslations(descs);
    setFeaturesByLang(feats);
    setCode(plan.code); setBasePrice(plan.price); setBaseCurrency(plan.currency);
    const mergedPrices: Record<string, string> = { ...(plan.prices || {}) };
    for (const c of currencies) if (mergedPrices[c.code] === undefined) mergedPrices[c.code] = "";
    setPrices(mergedPrices);
    setBillingPeriod(plan.billing_period); setDurationDays(plan.duration_days);
    setLevel(plan.level); setSortOrder(plan.sort_order);
    setIsActive(plan.is_active); setIsFeatured(plan.is_featured);
    setEditingPlan(plan); setError(""); setIsDirty(false); setShowForm(true);
    setPlanServices([]);
    try {
      const res = await api.get(`/subscriptions/admin/plans/${plan.id}/services/`);
      setPlanServices((res.data || []).map((r: any) => ({
        code: r.service_code,
        limit: r.limit === null || r.limit === undefined ? "" : String(r.limit),
        period: r.period,
      })));
    } catch {}
  };

  const buildFeatures = (): Record<string, string>[] => {
    const arrays = LANGUAGES.map((l) => (featuresByLang[l.code] || "").split("\n").map((s) => s.trim()).filter(Boolean));
    const maxLen = Math.max(0, ...arrays.map((a) => a.length));
    const result: Record<string, string>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const obj: Record<string, string> = {};
      LANGUAGES.forEach((l, li) => { if (arrays[li][i]) obj[l.code] = arrays[li][i]; });
      result.push(obj);
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError("رمز الباقة مطلوب"); return; }
    if (!nameTranslations["ar"]?.trim() && !nameTranslations["en"]?.trim()) { setError("الاسم بالعربية أو الإنجليزية مطلوب"); return; }
    const cleanPrices: Record<string, string> = {};
    for (const c of currencies) {
      const v = (prices[c.code] || "").trim();
      if (v) cleanPrices[c.code] = v;
    }
    const payload = {
      code: code.trim(),
      name: nameTranslations,
      description: descTranslations,
      price: basePrice,
      currency: baseCurrency,
      prices: cleanPrices,
      billing_period: billingPeriod,
      duration_days: Number(durationDays),
      level: Number(level),
      sort_order: Number(sortOrder),
      is_active: isActive,
      is_featured: isFeatured,
      features: buildFeatures(),
    };
    try {
      let savedId: number | null = editingPlan ? editingPlan.id : null;
      if (savedId) {
        await api.put(`/subscriptions/admin/plans/${savedId}/`, payload);
      } else {
        const res = await api.post("/subscriptions/admin/plans/", payload);
        savedId = res.data.id;
      }
      const servicesPayload = planServices.map((s, i) => ({
        code: s.code,
        limit: s.limit,
        period: s.period,
        sort_order: i,
      }));
      if (savedId) {
        await api.put(`/subscriptions/admin/plans/${savedId}/services/`, servicesPayload);
      }
      resetForm(); fetchPlans();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/subscriptions/admin/plans/${id}/`); fetchPlans(); } catch {}
  };

  const addService = () => {
    if (!selectedServiceCode) return;
    if (planServices.some((s) => s.code === selectedServiceCode)) { setSelectedServiceCode(""); return; }
    setPlanServices((prev) => [...prev, { code: selectedServiceCode, limit: "", period: "monthly" }]);
    setSelectedServiceCode("");
  };

  const updateServiceRow = (idx: number, patch: Partial<PlanServiceRow>) => {
    setPlanServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeService = (idx: number) => {
    setPlanServices((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateService = async () => {
    setServiceError("");
    if (!newServiceCode.trim() || !newServiceNameAr.trim()) { setServiceError("رمز الخدمة والاسم بالعربية مطلوبان"); return; }
    try {
      await api.post("/subscriptions/admin/services/", {
        code: newServiceCode.trim(),
        name: { ar: newServiceNameAr.trim(), en: newServiceNameEn.trim() },
        sort_order: catalog.length + 1,
        is_active: true,
      });
      setNewServiceCode(""); setNewServiceNameAr(""); setNewServiceNameEn("");
      fetchCatalog();
    } catch (err: any) { setServiceError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/subscriptions/admin/services/${id}/`); fetchCatalog(); } catch {}
  };

  const resetCurrencyForm = () => {
    setCurrencyForm({ code: "", name_ar: "", name_en: "", symbol: "", rate: "" });
    setCurrencyIsBase(false);
    setEditingCurrencyId(null);
    setCurrencyError("");
  };

  const startEditCurrency = (c: AdminCurrency) => {
    setEditingCurrencyId(c.id);
    setCurrencyIsBase(c.is_base);
    setCurrencyForm({
      code: c.code,
      name_ar: c.name?.ar || "",
      name_en: c.name?.en || "",
      symbol: c.symbol || "",
      rate: c.rate,
    });
    setCurrencyError("");
  };

  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = currencyForm.code.trim().toUpperCase();
    if (code.length !== 3) { setCurrencyError("رمز العملة يجب أن يكون 3 أحرف"); return; }
    if (!Number.isFinite(Number(currencyForm.rate)) || Number(currencyForm.rate) <= 0) { setCurrencyError("معامل الصرف يجب أن يكون رقماً موجباً"); return; }
    const payload = {
      code,
      name: { ar: currencyForm.name_ar.trim(), en: currencyForm.name_en.trim() },
      symbol: currencyForm.symbol.trim(),
      rate: currencyForm.rate.trim(),
      is_base: currencyIsBase,
      is_active: true,
      sort_order: currencies.length + 1,
    };
    try {
      if (editingCurrencyId) {
        await api.put(`/subscriptions/admin/currencies/${editingCurrencyId}/`, payload);
      } else {
        await api.post("/subscriptions/admin/currencies/", payload);
      }
      resetCurrencyForm();
      fetchCurrencies();
    } catch (err: any) { setCurrencyError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const handleRateSave = async (c: AdminCurrency) => {
    const raw = (rateEdits[c.id] ?? "").trim();
    if (!raw || !Number.isFinite(Number(raw)) || Number(raw) <= 0) return;
    try {
      await api.patch(`/subscriptions/admin/currencies/${c.id}/`, { rate: raw });
      setRateEdits(prev => { const n = { ...prev }; delete n[c.id]; return n; });
      fetchCurrencies();
    } catch (err: any) { setCurrencyError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const handleToggleCurrencyActive = async (c: AdminCurrency) => {
    try {
      await api.patch(`/subscriptions/admin/currencies/${c.id}/`, { is_active: !c.is_active });
      fetchCurrencies();
    } catch (err: any) { setCurrencyError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const handleSetBaseCurrency = async (c: AdminCurrency) => {
    if (c.is_base) return;
    try {
      await api.patch(`/subscriptions/admin/currencies/${c.id}/`, { is_base: true });
      fetchCurrencies();
    } catch (err: any) { setCurrencyError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const handleDeleteCurrency = async (c: AdminCurrency) => {
    if (!confirm(`حذف العملة ${c.code}؟`)) return;
    try { await api.delete(`/subscriptions/admin/currencies/${c.id}/`); fetchCurrencies(); }
    catch (err: any) { setCurrencyError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ"); }
  };

  const availableServices = catalog.filter((s) => s.is_active && !planServices.some((ps) => ps.code === s.code));
  const serviceName = (code: string) => {
    const svc = catalog.find((s) => s.code === code);
    return svc?.name?.[locale] || svc?.name?.ar || svc?.name?.en || code;
  };
  const filledCount = LANGUAGES.filter((l) => nameTranslations[l.code]?.trim()).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.subscriptions")}</h1>
          <button onClick={() => resetForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingPlan ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الرمز التعريفي</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder="pro" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>السعر الأساسي</label>
                  <input type="text" inputMode="decimal" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>عملة الدفع</label>
                  <input type="text" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder="JOD" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>فترة الفوترة</label>
                  <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    <option value="monthly">{t("subscriptions.monthly")}</option>
                    <option value="yearly">{t("subscriptions.yearly")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>المدة (يوم)</label>
                  <input type="number" value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.level")} (0=مجاني)</label>
                  <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الترتيب</label>
                  <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> نشط
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> الأكثر شهرة
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex gap-3 items-end mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
                    <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                      {LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>{l.label} {nameTranslations[l.code]?.trim() ? "✅" : ""}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الاسم ({langName(selectedLang)})</label>
                    <input type="text" value={nameTranslations[selectedLang] || ""}
                      onChange={(e) => setNameTranslations(prev => ({ ...prev, [selectedLang]: e.target.value }))}
                      className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                      dir={LANGUAGES.find((l) => l.code === selectedLang)?.rtl ? "rtl" : "ltr"} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الوصف ({langName(selectedLang)})</label>
                    <textarea value={descTranslations[selectedLang] || ""}
                      onChange={(e) => setDescTranslations(prev => ({ ...prev, [selectedLang]: e.target.value }))}
                      className={inputCls} rows={2} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", resize: "vertical" }}
                      dir={LANGUAGES.find((l) => l.code === selectedLang)?.rtl ? "rtl" : "ltr"} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الميزات ({langName(selectedLang)}) — سطر لكل ميزة</label>
                    <textarea value={featuresByLang[selectedLang] || ""}
                      onChange={(e) => setFeaturesByLang(prev => ({ ...prev, [selectedLang]: e.target.value }))}
                      className={inputCls} rows={5} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", resize: "vertical" }}
                      dir={LANGUAGES.find((l) => l.code === selectedLang)?.rtl ? "rtl" : "ltr"} />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-3">
                  {LANGUAGES.map((l) => (
                    <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${nameTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                      style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                      onClick={() => setSelectedLang(l.code)}>{l.code} {nameTranslations[l.code]?.trim() ? "✓" : ""}</span>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>تم تعبئة {filledCount} من {LANGUAGES.length} لغات</p>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الأسعار للعرض لكل عملة</label>
                {currencies.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>لا توجد عملات — أضف العملات وأسعار الصرف من قسم «العملات وأسعار الصرف» بالأسفل.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {currencies.map((c) => {
                      const computed = computedPrice(c.code);
                      return (
                        <div key={c.code}>
                          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>{c.symbol ? `${c.symbol} ` : ""}{c.code}{c.is_base ? " (أساسية)" : ""}</label>
                          <input type="text" inputMode="decimal" value={prices[c.code] || ""}
                            onChange={(e) => setPrices(prev => ({ ...prev, [c.code]: e.target.value }))}
                            className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.55rem 0.75rem" }}
                            placeholder={computed || "0.00"} />
                          {!c.is_base && (
                            <button type="button"
                              onClick={() => { if (computed) setPrices(prev => ({ ...prev, [c.code]: computed })); }}
                              className="mt-1 w-full text-[11px] font-semibold py-1 rounded-lg transition-all disabled:opacity-40"
                              style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
                              disabled={computed === null}>
                              استخدم المحسوب{computed ? ` (${computed})` : ""}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>السعر المحسوب = السعر الأساسي × معامل الصرف. اترك الحقل فارغاً للاستخدام المحسوب تلقائياً، أو عدّله يدوياً لتقريبه لرقم مقبول. الدفع الفعلي يتم بعملة الحساب ({baseCurrency || "JOD"}).</p>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الخدمات المرتبطة بالباقة وحصص الاستخدام</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <select value={selectedServiceCode} onChange={(e) => setSelectedServiceCode(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", flex: 1, minWidth: 200 }}>
                    <option value="">— اختر خدمة —</option>
                    {availableServices.map((s) => (
                      <option key={s.code} value={s.code}>{s.name?.ar || s.name?.en || s.code}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addService} disabled={!selectedServiceCode} className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40" style={{ background: "var(--color-primary)" }}>+ إضافة خدمة</button>
                </div>
                {planServices.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>لا توجد خدمات مرتبطة — الباقة تتيح استخداماً غير محدود لكل الخدمات.</p>
                ) : (
                  <div className="space-y-2">
                    {planServices.map((row, idx) => (
                      <div key={row.code} className="flex flex-wrap items-center gap-3 p-3 rounded-2xl" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
                        <div className="flex-1 min-w-[140px]">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{serviceName(row.code)}</p>
                          <p className="text-[11px] font-mono" style={{ color: "var(--color-text-muted)" }}>{row.code}</p>
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>حد الاستخدام</label>
                          <input type="number" min="0" value={row.limit} placeholder="∞"
                            onChange={(e) => updateServiceRow(idx, { limit: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الفترة</label>
                          <select value={row.period} onChange={(e) => updateServiceRow(idx, { period: e.target.value })}
                            className="px-3 py-2 border rounded-xl" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}>
                            <option value="daily">يومي</option>
                            <option value="monthly">شهري</option>
                            <option value="yearly">سنوي</option>
                            <option value="lifetime">مدى الحياة</option>
                          </select>
                        </div>
                        <button type="button" onClick={() => removeService(idx)} className="px-2 py-2 text-sm font-medium transition-colors" style={{ color: "var(--color-error)" }} title="إزالة">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>اترك حد الاستخدام فارغاً للاستخدام غير المحدود، أو ضع 0 لتعطيل الخدمة. عدد مرات الاستخدام الفعلي يُحتسب تلقائياً عند استخدام المستخدم للخدمة.</p>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={() => resetForm()} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : plans.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الاسم</th>
                    <th className="col-hide-sm px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الرمز</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>السعر</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الفترة</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>المستوى</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {plans.map((plan) => (
                    <tr key={plan.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-4">
                        <p className="font-medium" style={{ color: "var(--color-text)" }}>{plan.name?.[locale] || plan.name?.ar || plan.name?.en || "-"}</p>
                        <p className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                          {plan.is_featured && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--color-warning)", color: "#FFF" }}>{t("subscriptions.popular")}</span>}
                          {plan.is_active ? <span className="text-[var(--color-success)]">نشط</span> : <span className="text-[var(--color-error)]">معطل</span>}
                        </p>
                      </td>
                      <td className="col-hide-sm px-6 py-4 font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>{plan.code}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{plan.price} {plan.currency}</td>
                      <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{t(`subscriptions.${plan.billing_period}`)}</td>
                      <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{plan.level}</td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => startEdit(plan)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button onClick={() => handleDelete(plan.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-secondary)" }}>كتالوج الخدمات</h2>
          {serviceError && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{serviceError}</div>}
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="p-4 flex flex-wrap items-end gap-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="w-44">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الرمز</label>
                <input type="text" value={newServiceCode} onChange={(e) => { setNewServiceCode(e.target.value); setServiceError(""); }} placeholder="export_pdf" className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم بالعربية</label>
                <input type="text" value={newServiceNameAr} onChange={(e) => { setNewServiceNameAr(e.target.value); setServiceError(""); }} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم بالإنجليزية</label>
                <input type="text" value={newServiceNameEn} onChange={(e) => { setNewServiceNameEn(e.target.value); setServiceError(""); }} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} />
              </div>
              <button onClick={handleCreateService} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--color-primary)" }}>+ إضافة خدمة</button>
            </div>
            <div className="overflow-auto max-h-[300px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الخدمة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الرمز</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {catalog.map((s) => (
                    <tr key={s.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-3">
                        <p className="font-medium" style={{ color: "var(--color-text)" }}>{s.name?.[locale] || s.name?.ar || s.name?.en || s.code}</p>
                        {!s.is_active && <p className="text-[11px]" style={{ color: "var(--color-error)" }}>معطلة</p>}
                      </td>
                      <td className="px-6 py-3 font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>{s.code}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => handleDeleteService(s.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text-secondary)" }}>العملات وأسعار الصرف</h2>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>معامل الصرف = كم وحدة من هذه العملة تعادل 1 وحدة من العملة الأساسية ({currencies.find(c => c.is_base)?.code || "JOD"}). تُحسب أسعار العرض تلقائياً من المعامل، ويمكن تعديلها يدوياً في كل باقة.</p>
          {currencyError && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{currencyError}</div>}

          <div className="rounded-3xl shadow-xl p-5 mb-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--color-text)" }}>{editingCurrencyId ? "تعديل عملة" : "إضافة عملة"}</h3>
            <form onSubmit={handleCurrencySubmit} className="grid sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الرمز (3 أحرف)</label>
                <input type="text" value={currencyForm.code} maxLength={3} onChange={(e) => { setCurrencyForm(prev => ({ ...prev, code: e.target.value })); setCurrencyError(""); }} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} placeholder="SAR" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم بالعربية</label>
                <input type="text" value={currencyForm.name_ar} onChange={(e) => setCurrencyForm(prev => ({ ...prev, name_ar: e.target.value }))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} placeholder="ريال سعودي" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم بالإنجليزية</label>
                <input type="text" value={currencyForm.name_en} onChange={(e) => setCurrencyForm(prev => ({ ...prev, name_en: e.target.value }))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} placeholder="Saudi Riyal" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>الرمز المختصر</label>
                <input type="text" value={currencyForm.symbol} onChange={(e) => setCurrencyForm(prev => ({ ...prev, symbol: e.target.value }))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} placeholder="ر.س" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>معامل الصرف</label>
                <input type="text" inputMode="decimal" value={currencyForm.rate} onChange={(e) => setCurrencyForm(prev => ({ ...prev, rate: e.target.value }))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)", padding: "0.5rem 0.75rem" }} placeholder="5.29" />
              </div>
              <div className="sm:col-span-2 md:col-span-5 flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                  <input type="checkbox" checked={currencyIsBase} onChange={(e) => setCurrencyIsBase(e.target.checked)} /> عملة أساسية
                </label>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{editingCurrencyId ? t("common.save") : "+ إضافة"}</button>
                {editingCurrencyId && (
                  <button type="button" onClick={resetCurrencyForm} className="px-5 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>العملة</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>الرمز</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>معامل الصرف</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>أساسية</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>نشطة</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {currencies.map((c) => (
                    <tr key={c.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-3">
                        <p className="font-medium" style={{ color: "var(--color-text)" }}>{c.name?.ar || c.name?.en || c.code}</p>
                        <p className="text-[11px] font-mono" style={{ color: "var(--color-text-muted)" }}>{c.code}</p>
                      </td>
                      <td className="col-hide-md px-6 py-3" style={{ color: "var(--color-text-secondary)" }}>{c.symbol || "-"}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <input type="text" inputMode="decimal" value={rateEdits[c.id] ?? c.rate}
                            onChange={(e) => setRateEdits(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="w-24 px-2 py-1.5 border rounded-lg font-mono text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
                          <button type="button" onClick={() => handleRateSave(c)} className="text-xs font-semibold px-2 py-1.5 rounded-lg transition-all" style={{ color: "var(--color-primary)", background: "var(--color-primary-light)" }}>حفظ</button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {c.is_base ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--color-success)", color: "#FFF" }}>أساسية</span>
                        ) : (
                          <button type="button" onClick={() => handleSetBaseCurrency(c)} className="text-xs font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>تعيين كأساس</button>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <input type="checkbox" checked={c.is_active} onChange={() => handleToggleCurrencyActive(c)} />
                      </td>
                      <td className="px-6 py-3 flex gap-3">
                        <button type="button" onClick={() => startEditCurrency(c)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button type="button" onClick={() => handleDeleteCurrency(c)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }} disabled={c.is_base}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                  {currencies.length === 0 && (
                    <tr><td className="px-6 py-6 text-sm" style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

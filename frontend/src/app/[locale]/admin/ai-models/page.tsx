"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface AIModel {
  id: number;
  provider: string;
  model_id: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  is_default: boolean;
  max_tokens: number;
  sort_order: number;
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "tr", label: "Türkçe" },
  { code: "ur", label: "اردو" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "bn", label: "বাংলা" },
];

interface AIProvider {
  id: number;
  name: string;
  provider_type: string;
  provider_type_display?: {
    code: string;
    name_ar: string;
    name_en: string;
    needs_base_url: boolean;
    default_base_url: string;
    needs_api_key: boolean;
    supports_fetching: boolean;
  };
  base_url: string;
  api_key_configured: boolean;
  api_key_masked: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProviderTypeOption {
  code: string;
  name_ar: string;
  name_en: string;
  needs_base_url: boolean;
  default_base_url: string;
  needs_api_key: boolean;
  supports_fetching: boolean;
  sort_order: number;
  is_active: boolean;
}

interface FetchedModel {
  model_id: string;
  display_name: string;
  description: string;
  input_token_limit: number;
  output_token_limit: number;
}

const inputCls = "w-full px-3 py-2 rounded-xl text-sm outline-none transition-all";
const labelCls = "block text-xs font-medium mb-1";

type FetchMode = "stored" | "fresh";

export default function AdminAIModelsPage() {
  const t = useTranslations();
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [providerTypes, setProviderTypes] = useState<ProviderTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch state
  const [fetchMode, setFetchMode] = useState<FetchMode>("stored");
  const [selectedProviderId, setSelectedProviderId] = useState<number | "">("");
  const [freshApiKey, setFreshApiKey] = useState("");
  const [freshProviderType, setFreshProviderType] = useState("google");
  const [freshBaseUrl, setFreshBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<FetchedModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // Provider modal state
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [providerFormName, setProviderFormName] = useState("");
  const [providerFormType, setProviderFormType] = useState("google");
  const [providerFormBaseUrl, setProviderFormBaseUrl] = useState("");
  const [providerFormKey, setProviderFormKey] = useState("");
  const [savingProvider, setSavingProvider] = useState(false);

  // Model modal state
  const [showModelForm, setShowModelForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [savingModel, setSavingModel] = useState(false);
  const [formProvider, setFormProvider] = useState("google");
  const [formModelId, setFormModelId] = useState("");
  const [formLangTab, setFormLangTab] = useState("ar");
  const [formName, setFormName] = useState<Record<string, string>>({});
  const [formDesc, setFormDesc] = useState<Record<string, string>>({});
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };

  const loadModels = async () => {
    try {
      const { data } = await api.get("/ai/admin/models/");
      setModels(data?.results ?? data ?? []);
    } catch { /* ignore */ }
  };

  const loadProviderTypes = async () => {
    try {
      const { data } = await api.get("/ai/admin/provider-types/");
      setProviderTypes(data?.results ?? data ?? []);
    } catch { /* ignore */ }
  };

  const loadProviders = async () => {
    try {
      const { data } = await api.get("/ai/admin/providers/");
      setProviders(data?.results ?? data ?? []);
      if ((data?.results ?? data ?? []).length > 0) {
        setSelectedProviderId((data.results ?? data)[0].id);
      }
    } catch { /* ignore */ }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadModels(), loadProviders(), loadProviderTypes()]);
    setIsLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ---- Provider CRUD ----

  const openProviderCreate = () => {
    setEditingProvider(null);
    setProviderFormName("");
    setProviderFormType("google");
    setProviderFormBaseUrl("");
    setProviderFormKey("");
    setError("");
    setShowProviderForm(true);
  };

  const openProviderEdit = (p: AIProvider) => {
    setEditingProvider(p);
    setProviderFormName(p.name);
    setProviderFormType(p.provider_type);
    setProviderFormBaseUrl(p.base_url || "");
    setProviderFormKey("");
    setError("");
    setShowProviderForm(true);
  };

  const handleSaveProvider = async () => {
    if (!providerFormName.trim()) {
      setError("اسم المزود مطلوب");
      return;
    }
    setSavingProvider(true);
    setError("");
    try {
      const pt = providerTypes.find((t) => t.code === providerFormType);
      const payload: Record<string, any> = { name: providerFormName, provider_type: providerFormType };
      if (pt?.needs_base_url && providerFormBaseUrl.trim()) {
        payload.base_url = providerFormBaseUrl.trim();
      }
      if (pt?.needs_api_key && providerFormKey.trim()) {
        payload.api_key = providerFormKey;
      }
      if (editingProvider) {
        await api.put(`/ai/admin/providers/${editingProvider.id}/`, payload);
      } else {
        await api.post("/ai/admin/providers/", payload);
      }
      setShowProviderForm(false);
      await loadProviders();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ");
    }
    setSavingProvider(false);
  };

  const handleDeleteProvider = async (id: number) => {
    if (!confirm("تأكيد حذف المزود؟")) return;
    try {
      await api.delete(`/ai/admin/providers/${id}/`);
      await loadProviders();
    } catch { /* ignore */ }
  };

  // ---- Fetch & Import ----

  const getFetchPayload = () => {
    if (fetchMode === "stored" && selectedProviderId) {
      return { provider_id: selectedProviderId };
    }
    const pt = providerTypes.find((t) => t.code === freshProviderType);
    const payload: Record<string, any> = { provider_type: freshProviderType };
    if (pt?.needs_base_url && freshBaseUrl.trim()) {
      payload.base_url = freshBaseUrl.trim();
    }
    if (pt?.needs_api_key && freshApiKey.trim()) {
      payload.api_key = freshApiKey;
    }
    return payload;
  };

  const canFetch = () => {
    if (fetchMode === "stored") {
      if (!selectedProviderId) return false;
      const p = providers.find((pr) => pr.id === selectedProviderId);
      if (!p) return false;
      const pt = providerTypes.find((t) => t.code === p.provider_type);
      if (pt?.needs_api_key) return p.api_key_configured;
      return true;
    }
    const pt = providerTypes.find((t) => t.code === freshProviderType);
    if (pt?.needs_api_key) return freshApiKey.trim().length > 0;
    return true;
  };

  const handleFetch = async () => {
    if (!canFetch()) return;
    setFetching(true);
    setError("");
    setFetchedModels([]);
    setSelectedModels(new Set());
    try {
      const { data } = await api.post("/ai/admin/fetch-models/", getFetchPayload());
      setFetchedModels(data.models || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "فشل الاتصال بالمزود");
    }
    setFetching(false);
  };

  const toggleSelected = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedModels.size === 0) return;
    setImporting(true);
    setError("");
    try {
      const activeProvider = providers.find((p) => p.id === selectedProviderId);
      const providerType = activeProvider?.provider_type || freshProviderType;
      const items = fetchedModels
        .filter((m) => selectedModels.has(m.model_id))
        .map((m) => ({
          model_id: m.model_id,
          provider: providerType,
          display_name: m.display_name,
          description: m.description,
          output_token_limit: m.output_token_limit,
          name_ar: m.display_name,
          name_en: m.display_name,
        }));
      await api.post("/ai/admin/import-models/", { models: items });
      setFetchedModels([]);
      setSelectedModels(new Set());
      await loadModels();
    } catch (err: any) {
      setError(err.response?.data?.error || "فشل استيراد النماذج");
    }
    setImporting(false);
  };

  // ---- Model CRUD ----

  const openModelCreate = () => {
    setEditingModel(null);
    setFormProvider("google");
    setFormModelId("");
    setFormName({});
    setFormDesc({});
    setFormLangTab("ar");
    setFormMaxTokens(4096);
    setFormSortOrder(models.length + 1);
    setFormIsActive(true);
    setFormIsDefault(false);
    setError("");
    setShowModelForm(true);
  };

  const openModelEdit = (m: AIModel) => {
    setEditingModel(m);
    setFormProvider(m.provider);
    setFormModelId(m.model_id);
    setFormName(m.name || { ar: m.name_ar, en: m.name_en });
    setFormDesc(m.description || { ar: m.description_ar, en: m.description_en });
    setFormLangTab("ar");
    setFormMaxTokens(m.max_tokens);
    setFormSortOrder(m.sort_order);
    setFormIsActive(m.is_active);
    setFormIsDefault(m.is_default);
    setError("");
    setShowModelForm(true);
  };

  const handleSaveModel = async () => {
    if (!formModelId.trim() || !formName["ar"]?.trim()) {
      setError("model_id و الاسم بالعربية مطلوبان");
      return;
    }
    setSavingModel(true);
    setError("");
    try {
      const payload = {
        provider: formProvider,
        model_id: formModelId,
        name: formName,
        description: formDesc,
        max_tokens: formMaxTokens,
        sort_order: formSortOrder,
        is_active: formIsActive,
        is_default: formIsDefault,
      };
      if (editingModel) {
        await api.put(`/ai/admin/models/${editingModel.id}/`, payload);
      } else {
        await api.post("/ai/admin/models/", payload);
      }
      setShowModelForm(false);
      await loadModels();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ");
    }
    setSavingModel(false);
  };

  const handleDeleteModel = async (id: number) => {
    if (!confirm("تأكيد الحذف؟")) return;
    try {
      await api.delete(`/ai/admin/models/${id}/`);
      await loadModels();
    } catch { /* ignore */ }
  };

  const handleToggleActive = async (m: AIModel) => {
    try {
      await api.put(`/ai/admin/models/${m.id}/`, { ...m, is_active: !m.is_active });
      await loadModels();
    } catch { /* ignore */ }
  };

  const providerTypeLabel = (val: string) => {
    const pt = providerTypes.find((o) => o.code === val);
    if (pt) return `${pt.name_en} / ${pt.name_ar}`;
    return val;
  };

  const providerOptions = providers.filter((p) => p.is_active);

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ background: "var(--color-background)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>نماذج AI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>إدارة مزودي وموديلات الذكاء الاصطناعي</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
          {error}
          <button onClick={() => setError("")} className="mr-2 font-bold">✕</button>
        </div>
      )}

      {/* ====== Provider Management ====== */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "var(--color-muted)", borderColor: "var(--color-border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>🏢 مزودو الخدمة ({providers.length})</h2>
          <button onClick={openProviderCreate}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            + إضافة مزود
          </button>
        </div>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.length === 0 ? (
            <div className="sm:col-span-full text-center py-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
              لا يوجد مزودون بعد. أضف مزوداً لتخزين مفتاح API واستخدامه في جلب النماذج.
            </div>
          ) : providers.map((p) => (
            <div key={p.id} className="rounded-xl border p-4 relative" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{p.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{providerTypeLabel(p.provider_type)}</div>
                </div>
                {(() => {
                  const pt = providerTypes.find((t) => t.code === p.provider_type);
                  if (!pt?.needs_api_key) return <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">لا يحتاج مفتاح</div>;
                  return <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.api_key_configured ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.api_key_configured ? "مفتاح محفوظ" : "بدون مفتاح"}
                  </div>;
                })()}
              </div>
              {p.api_key_configured && (
                <div className="text-xs font-mono mb-1" style={{ color: "var(--color-text-muted)" }}>
                  {p.api_key_masked}
                </div>
              )}
              {p.base_url && (
                <div className="text-xs mb-1 truncate" style={{ color: "var(--color-text-muted)" }}>
                  {p.base_url}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={() => openProviderEdit(p)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
                >
                  تعديل
                </button>
                <button onClick={() => handleDeleteProvider(p.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                  style={{ color: "var(--color-error)", backgroundColor: "var(--color-error-light)" }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ====== Fetch Models ====== */}
      <div className="rounded-2xl border p-4 sm:p-5" style={{ borderColor: "var(--color-border)" }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: "var(--color-text)" }}>🔗 جلب النماذج</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFetchMode("stored")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${fetchMode === "stored" ? "text-white" : ""}`}
            style={fetchMode === "stored"
              ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", borderColor: "transparent" }
              : { color: "var(--color-text)", borderColor: "var(--color-border)" }}
          >
            🗂️ مزود محفوظ
          </button>
          <button onClick={() => setFetchMode("fresh")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${fetchMode === "fresh" ? "text-white" : ""}`}
            style={fetchMode === "fresh"
              ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", borderColor: "transparent" }
              : { color: "var(--color-text)", borderColor: "var(--color-border)" }}
          >
            🔑 مفتاح مؤقت
          </button>
        </div>

        {fetchMode === "stored" ? (
          <div className="mb-4">
            <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>اختر مزوداً</label>
            <select value={selectedProviderId} onChange={(e) => setSelectedProviderId(e.target.value ? parseInt(e.target.value) : "")}
              className={inputCls} style={style}
            >
              <option value="">-- اختر مزوداً --</option>
              {providerOptions.map((p) => {
                const pt = providerTypes.find((t) => t.code === p.provider_type);
                const canUse = pt?.needs_api_key ? p.api_key_configured : true;
                return (
                  <option key={p.id} value={p.id} disabled={!canUse}>
                    {p.name} {canUse ? "" : "(بدون مفتاح)"}
                  </option>
                );
              })}
            </select>
            {!providerOptions.some((p) => {
              const pt = providerTypes.find((t) => t.code === p.provider_type);
              return pt?.needs_api_key ? p.api_key_configured : true;
            }) && (
              <p className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>
                لا يوجد مزود جاهز للجلب. بعض المزودين لا يحتاجون مفتاح API (مثل Ollama).
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4 space-y-3">
            <div>
              <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>المزود</label>
              <select value={freshProviderType} onChange={(e) => setFreshProviderType(e.target.value)}
                className={inputCls} style={style}
              >
                {providerTypes.filter((pt) => pt.is_active).map((pt) => (
                  <option key={pt.code} value={pt.code}>{pt.name_en} / {pt.name_ar}</option>
                ))}
              </select>
            </div>
            {providerTypes.find((pt) => pt.code === freshProviderType)?.needs_base_url && (
              <div>
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>رابط API</label>
                <input value={freshBaseUrl}
                  onChange={(e) => setFreshBaseUrl(e.target.value)}
                  className={inputCls} style={style}
                  placeholder={providerTypes.find((pt) => pt.code === freshProviderType)?.default_base_url || "https://api.example.com"}
                />
              </div>
            )}
            {providerTypes.find((pt) => pt.code === freshProviderType)?.needs_api_key && (
              <div>
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>مفتاح API مؤقت</label>
                <div className="flex gap-2">
                  <input type={showKey ? "text" : "password"} value={freshApiKey}
                    onChange={(e) => setFreshApiKey(e.target.value)}
                    className={inputCls + " flex-1"} style={style}
                    placeholder={freshProviderType === "openai" ? "sk-..." : freshProviderType === "google" ? "AIzaSy..." : "مفتاح API"}
                  />
                  <button onClick={() => setShowKey(!showKey)}
                    className="px-3 py-2 rounded-xl text-sm border" style={style}
                  >
                    {showKey ? "إخفاء" : "إظهار"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={handleFetch} disabled={fetching || !canFetch()}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          {fetching ? "جارٍ الاتصال..." : "🚀 جلب النماذج المتاحة"}
        </button>
      </div>

      {/* ====== Fetched Models ====== */}
      {fetchedModels.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
              📋 النماذج المتاحة ({fetchedModels.length})
            </h2>
            <button onClick={handleImport} disabled={selectedModels.size === 0 || importing}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              {importing ? "جارٍ الاستيراد..." : `استيراد المحدد (${selectedModels.size})`}
            </button>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto" style={{ borderColor: "var(--color-border)" }}>
            {fetchedModels.map((m) => {
              const exists = models.some((em) => em.model_id === m.model_id);
              const checked = selectedModels.has(m.model_id);
              return (
                <label key={m.model_id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:opacity-80 ${exists ? "opacity-40" : ""}`}
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <input type="checkbox" checked={checked || exists} disabled={exists}
                    onChange={() => toggleSelected(m.model_id)}
                    className="w-4 h-4 rounded shrink-0" style={{ accentColor: "var(--color-primary)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                        {m.display_name}
                      </span>
                      {exists && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}>
                          موجود
                        </span>
                      )}
                    </div>
                    <code className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.model_id}</code>
                  </div>
                  <div className="text-xs text-left shrink-0" style={{ color: "var(--color-text-muted)" }}>
                    <div>{m.input_token_limit?.toLocaleString()} ←</div>
                    <div>{m.output_token_limit?.toLocaleString()} →</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== Current Models ====== */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "var(--color-muted)", borderColor: "var(--color-border)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>📦 النماذج الحالية ({models.length})</h2>
          <button onClick={openModelCreate}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            + إضافة يدوي
          </button>
        </div>
        {isLoading ? (
          <div className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>جاري التحميل...</div>
        ) : models.length === 0 ? (
          <div className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>لا توجد نماذج بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-muted)" }}>
                  <th className="text-right p-3 font-semibold" style={{ color: "var(--color-text)" }}>الاسم</th>
                  <th className="text-right p-3 font-semibold hidden md:table-cell" style={{ color: "var(--color-text)" }}>النموذج</th>
                  <th className="text-right p-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-text)" }}>المزود</th>
                  <th className="text-right p-3 font-semibold hidden lg:table-cell" style={{ color: "var(--color-text)" }}>الرموز</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "var(--color-text)" }}>مفعل</th>
                  <th className="text-center p-3 font-semibold" style={{ color: "var(--color-text)" }}>افتراضي</th>
                  <th className="text-left p-3 font-semibold" style={{ color: "var(--color-text)" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="p-3">
                      <div className="font-medium" style={{ color: "var(--color-text)" }}>{m.name?.ar || m.name_ar}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.name?.en || m.name_en}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <code className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-primary)" }}>{m.model_id}</code>
                    </td>
                    <td className="p-3 hidden sm:table-cell" style={{ color: "var(--color-text-secondary)" }}>{m.provider}</td>
                    <td className="p-3 hidden lg:table-cell" style={{ color: "var(--color-text-secondary)" }}>{m.max_tokens.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleToggleActive(m)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${m.is_active ? "text-green-600 bg-green-100" : "text-red-600 bg-red-100"}`}
                      >
                        {m.is_active ? "نعم" : "لا"}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      {m.is_default ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>افتراضي</span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="p-3 text-left">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openModelEdit(m)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
                        >
                          تعديل
                        </button>
                        <button onClick={() => handleDeleteModel(m.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ color: "var(--color-error)", backgroundColor: "var(--color-error-light)" }}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== Provider Modal ====== */}
      {showProviderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="font-bold" style={{ color: "var(--color-text)" }}>{editingProvider ? "تعديل المزود" : "إضافة مزود جديد"}</h2>
              <button onClick={() => setShowProviderForm(false)} className="p-1 rounded-lg" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>اسم المزود *</label>
                <input value={providerFormName} onChange={(e) => setProviderFormName(e.target.value)}
                  className={inputCls} style={style} placeholder="مثلاً: حساب Google الأساسي"
                />
              </div>
              <div>
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>نوع المزود</label>
                <select value={providerFormType} onChange={(e) => setProviderFormType(e.target.value)}
                  className={inputCls} style={style}
                >
                  {providerTypes.filter((pt) => pt.is_active).map((pt) => (
                    <option key={pt.code} value={pt.code}>{pt.name_en} / {pt.name_ar}</option>
                  ))}
                </select>
              </div>
              {providerTypes.find((pt) => pt.code === providerFormType)?.needs_base_url && (
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>رابط API</label>
                  <input value={providerFormBaseUrl}
                    onChange={(e) => setProviderFormBaseUrl(e.target.value)}
                    className={inputCls} style={style}
                    placeholder={providerTypes.find((pt) => pt.code === providerFormType)?.default_base_url || "https://api.example.com"}
                  />
                </div>
              )}
              {providerTypes.find((pt) => pt.code === providerFormType)?.needs_api_key && (
              <div>
                <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>
                  مفتاح API {editingProvider ? "(اتركه فارغاً للاحتفاظ بالمفتاح الحالي)" : ""}
                </label>
                <input type="password" value={providerFormKey}
                  onChange={(e) => setProviderFormKey(e.target.value)}
                  className={inputCls} style={style} placeholder={providerFormType === "openai" ? "sk-..." : "AIzaSy..."}
                />
                {editingProvider && providerFormKey.trim() && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-warning)" }}>سيتم تحديث المفتاح عند الحفظ</p>
                )}
              </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setShowProviderForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                إلغاء
              </button>
              <button onClick={handleSaveProvider} disabled={savingProvider}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                {savingProvider ? "جاري الحفظ..." : editingProvider ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== Model Modal ====== */}
      {showModelForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="font-bold" style={{ color: "var(--color-text)" }}>{editingModel ? "تعديل النموذج" : "إضافة نموذج جديد"}</h2>
              <button onClick={() => setShowModelForm(false)} className="p-1 rounded-lg" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>معرف النموذج *</label>
                  <input value={formModelId} onChange={(e) => setFormModelId(e.target.value)}
                    className={inputCls} style={style} placeholder="gemini-3.6-flash"
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>المزود</label>
                  <select value={formProvider} onChange={(e) => setFormProvider(e.target.value)}
                    className={inputCls} style={style}
                  >
                    {providerTypes.filter((pt) => pt.is_active).map((pt) => (
                      <option key={pt.code} value={pt.code}>{pt.name_en} / {pt.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Language tabs */}
              <div className="flex flex-wrap gap-1 pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                {LANGUAGES.map((lang) => (
                  <button key={lang.code} type="button" onClick={() => setFormLangTab(lang.code)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${formLangTab === lang.code ? "text-white" : ""}`}
                    style={formLangTab === lang.code
                      ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }
                      : { color: "var(--color-text-muted)" }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <div key={formLangTab} className="space-y-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>
                    الاسم ({LANGUAGES.find((l) => l.code === formLangTab)?.label}) {formLangTab === "ar" ? "*" : ""}
                  </label>
                  <input value={formName[formLangTab] || ""}
                    onChange={(e) => setFormName((prev) => ({ ...prev, [formLangTab]: e.target.value }))}
                    className={inputCls} style={style}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>
                    الوصف ({LANGUAGES.find((l) => l.code === formLangTab)?.label})
                  </label>
                  <textarea value={formDesc[formLangTab] || ""}
                    onChange={(e) => setFormDesc((prev) => ({ ...prev, [formLangTab]: e.target.value }))}
                    rows={2} className={inputCls + " resize-none"} style={style}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>الحد الأقصى للرموز</label>
                  <input type="number" value={formMaxTokens} onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 4096)}
                    className={inputCls} style={style}
                  />
                </div>
                <div>
                  <label className={labelCls} style={{ color: "var(--color-text-muted)" }}>الترتيب</label>
                  <input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                    className={inputCls} style={style}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded" style={{ accentColor: "var(--color-primary)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text)" }}>مفعل</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded" style={{ accentColor: "var(--color-primary)" }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text)" }}>افتراضي</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setShowModelForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                إلغاء
              </button>
              <button onClick={handleSaveModel} disabled={savingModel}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                {savingModel ? "جاري الحفظ..." : editingModel ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

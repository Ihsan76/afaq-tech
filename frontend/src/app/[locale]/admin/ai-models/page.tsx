"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface AIModel {
  id: number;
  provider: string;
  model_id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  is_default: boolean;
  max_tokens: number;
  sort_order: number;
}

export default function AdminAIModelsPage() {
  const t = useTranslations();
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AIModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formProvider, setFormProvider] = useState("google");
  const [formModelId, setFormModelId] = useState("");
  const [formNameAr, setFormNameAr] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formMaxTokens, setFormMaxTokens] = useState(4096);
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/ai/admin/models/");
      setModels(data?.results ?? data ?? []);
    } catch { /* ignore */ }
    setIsLoading(false);
  };

  useEffect(() => { loadModels(); }, []);

  const openCreate = () => {
    setEditing(null);
    setFormProvider("google");
    setFormModelId("");
    setFormNameAr("");
    setFormNameEn("");
    setFormDescAr("");
    setFormDescEn("");
    setFormMaxTokens(4096);
    setFormSortOrder(models.length + 1);
    setFormIsActive(true);
    setFormIsDefault(false);
    setError("");
    setShowForm(true);
  };

  const openEdit = (m: AIModel) => {
    setEditing(m);
    setFormProvider(m.provider);
    setFormModelId(m.model_id);
    setFormNameAr(m.name_ar);
    setFormNameEn(m.name_en);
    setFormDescAr(m.description_ar);
    setFormDescEn(m.description_en);
    setFormMaxTokens(m.max_tokens);
    setFormSortOrder(m.sort_order);
    setFormIsActive(m.is_active);
    setFormIsDefault(m.is_default);
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formModelId.trim() || !formNameAr.trim()) {
      setError("model_id و name_ar مطلوبان");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        provider: formProvider,
        model_id: formModelId,
        name_ar: formNameAr,
        name_en: formNameEn,
        description_ar: formDescAr,
        description_en: formDescEn,
        max_tokens: formMaxTokens,
        sort_order: formSortOrder,
        is_active: formIsActive,
        is_default: formIsDefault,
      };
      if (editing) {
        await api.put(`/ai/admin/models/${editing.id}/`, payload);
      } else {
        await api.post("/ai/admin/models/", payload);
      }
      setShowForm(false);
      await loadModels();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "حدث خطأ");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
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

  if (isLoading) {
    return <div className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>جاري التحميل...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>نماذج AI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>إدارة نماذج الذكاء الاصطناعي المتاحة</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          + إضافة نموذج
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>
          {error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "var(--color-muted)" }}>
              <th className="text-right p-3 font-semibold" style={{ color: "var(--color-text)" }}>الاسم</th>
              <th className="text-right p-3 font-semibold hidden md:table-cell" style={{ color: "var(--color-text)" }}>النموذج</th>
              <th className="text-right p-3 font-semibold hidden sm:table-cell" style={{ color: "var(--color-text)" }}>المزود</th>
              <th className="text-right p-3 font-semibold hidden lg:table-cell" style={{ color: "var(--color-text)" }}>الرموز</th>
              <th className="text-center p-3 font-semibold" style={{ color: "var(--color-text)" }}>مفعل</th>
              <th className="text-center p-3 font-semibold" style={{ color: "var(--color-text)" }}>افتراضي</th>
              <th className="text-left p-3 font-semibold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>لا توجد نماذج بعد</td>
              </tr>
            )}
            {models.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                <td className="p-3">
                  <div className="font-medium" style={{ color: "var(--color-text)" }}>{m.name_ar}</div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.name_en}</div>
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
                    <button onClick={() => openEdit(m)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ color: "var(--color-primary)", backgroundColor: "var(--color-primary-light)" }}
                    >
                      تعديل
                    </button>
                    <button onClick={() => handleDelete(m.id)}
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h2 className="font-bold" style={{ color: "var(--color-text)" }}>{editing ? "تعديل النموذج" : "إضافة نموذج جديد"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>معرف النموذج *</label>
                  <input value={formModelId} onChange={(e) => setFormModelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                    placeholder="gemini-3.6-flash"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>المزود</label>
                  <select value={formProvider} onChange={(e) => setFormProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  >
                    <option value="google">Google Gemini</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم (عربي) *</label>
                  <input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>الاسم (إنجليزي)</label>
                  <input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>الوصف (عربي)</label>
                <textarea value={formDescAr} onChange={(e) => setFormDescAr(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>الحد الأقصى للرموز</label>
                  <input type="number" value={formMaxTokens} onChange={(e) => setFormMaxTokens(parseInt(e.target.value) || 4096)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>الترتيب</label>
                  <input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
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
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                إلغاء
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                {saving ? "جاري الحفظ..." : editing ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

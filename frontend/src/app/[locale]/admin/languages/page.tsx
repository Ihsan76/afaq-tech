"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAdminLanguages } from "@/lib/useLanguages";
import { useApiList } from "@/lib/useApi";

interface LanguageForm {
  code: string;
  name: string;
  native_name: string;
  flag: string;
  is_rtl: boolean;
  is_active: boolean;
  is_default: boolean;
  order: number;
}

interface TranslationItem {
  id: number;
  key: string;
  namespace: string;
  translations: Record<string, string>;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

const emptyForm: LanguageForm = {
  code: "",
  name: "",
  native_name: "",
  flag: "",
  is_rtl: false,
  is_active: true,
  is_default: false,
  order: 99,
};

export default function AdminLanguagesPage() {
  const t = useTranslations();
  const { languages, loading, mutate } = useAdminLanguages();
  const { data: translations, mutate: mutateTranslations } = useApiList<TranslationItem>("/core/admin/translations/");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LanguageForm>(emptyForm);
  const [error, setError] = useState("");
  const [modalTab, setModalTab] = useState<"meta" | "translations">("meta");
  const [tsearch, setTsearch] = useState("");
  const [tDraft, setTDraft] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<number | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setModalTab("meta");
    setShowForm(true);
  };

  const openEdit = (lang: (typeof languages)[number], tab: "meta" | "translations" = "meta") => {
    setForm({
      code: lang.code,
      name: lang.name,
      native_name: lang.native_name,
      flag: lang.flag,
      is_rtl: lang.is_rtl,
      is_active: lang.is_active,
      is_default: lang.is_default,
      order: lang.order,
    });
    setEditingId(lang.id);
    setError("");
    setTsearch("");
    setNewKey("");
    setNewValue("");
    setModalTab(tab);
    setShowForm(true);
  };

  const filteredTranslations = useMemo(() => {
    let list = translations || [];
    if (tsearch.trim()) {
      const q = tsearch.trim().toLowerCase();
      list = list.filter((item) => item.key.toLowerCase().includes(q));
    }
    return list;
  }, [translations, tsearch]);

  const set = <K extends keyof LanguageForm>(key: K, value: LanguageForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setError(t("admin.langCodeRequired")); return; }
    if (!form.name.trim()) { setError(t("admin.langNameRequired")); return; }
    const payload = { ...form, code: form.code.trim().toLowerCase() };
    try {
      if (editingId) await api.put(`/core/admin/languages/${editingId}/`, payload);
      else await api.post("/core/admin/languages/create/", payload);
      setShowForm(false);
      setError("");
      mutate();
    } catch (e: any) {
      setError(e.response?.data ? JSON.stringify(e.response.data) : t("common.error"));
    }
  };

  const handleDelete = async (id: number, isDefault: boolean) => {
    if (isDefault) { setError(t("admin.langCannotDeleteDefault")); return; }
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/core/admin/languages/${id}/delete/`);
      mutate();
    } catch (e: any) {
      setError(e.response?.data?.error || t("common.error"));
    }
  };

  const setDefault = async (id: number) => {
    try {
      await api.patch(`/core/admin/languages/${id}/`, { is_default: true });
      mutate();
    } catch {
      // silent
    }
  };

  const saveTranslationValue = async (item: TranslationItem) => {
    const value = (tDraft[item.key] || "").trim();
    const current = item.translations || {};
    setSavingKey(item.id);
    setError("");
    try {
      const updated: Record<string, string> = { ...current };
      if (value) updated[form.code] = value;
      else delete updated[form.code];
      await api.patch(`/core/admin/translations/${item.id}/`, { translations: updated });
      mutateTranslations();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : t("common.error"));
    } finally {
      setSavingKey(null);
    }
  };

  const addTranslationKey = async () => {
    const key = newKey.trim();
    if (!key) { setError(t("admin.translationKeyRequired")); return; }
    setSavingKey(-1);
    setError("");
    try {
      const translations: Record<string, string> = {};
      if (newValue.trim()) translations[form.code] = newValue.trim();
      await api.post("/core/admin/translations/create/", { key, translations });
      setNewKey("");
      setNewValue("");
      mutateTranslations();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : t("common.error"));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.languages")}</h1>
          <button onClick={openCreate} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            + {t("common.add")}
          </button>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          {t("admin.languagesDesc")}
        </p>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {editingId ? t("common.edit") : t("common.add")}
              </h2>
              {editingId && (
                <div className="flex gap-1 rounded-xl p-1" style={{ background: "var(--color-background)" }}>
                  <button
                    type="button"
                    onClick={() => setModalTab("meta")}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: modalTab === "meta" ? "var(--color-primary)" : "transparent", color: modalTab === "meta" ? "#FFF" : "var(--color-text-secondary)" }}
                  >
                    {t("admin.langMetaTab")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab("translations")}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: modalTab === "translations" ? "var(--color-primary)" : "transparent", color: modalTab === "translations" ? "#FFF" : "var(--color-text-secondary)" }}
                  >
                    {t("admin.langTranslationsTab")}
                  </button>
                </div>
              )}
            </div>

            {modalTab === "meta" || !editingId ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.langCode")}</label>
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => set("code", e.target.value)}
                      disabled={!!editingId}
                      placeholder="ar, en, fr ..."
                      dir="ltr"
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.langName")}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Arabic, English ..."
                      dir="ltr"
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.langNativeName")}</label>
                    <input
                      type="text"
                      value={form.native_name}
                      onChange={(e) => set("native_name", e.target.value)}
                      placeholder="العربية"
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.langFlag")}</label>
                    <input
                      type="text"
                      value={form.flag}
                      onChange={(e) => set("flag", e.target.value)}
                      placeholder="🇸🇦"
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={form.is_rtl} onChange={(e) => set("is_rtl", e.target.checked)} />
                    {t("admin.langRtl")}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} />
                    {t("admin.langActive")}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={form.is_default} onChange={(e) => set("is_default", e.target.checked)} />
                    {t("admin.langDefault")}
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.langOrder")}</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => set("order", Number(e.target.value))}
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
                    {t("common.save")}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {t("admin.langTranslationsTab")} — {form.flag} {form.native_name || form.name} <span dir="ltr" style={{ color: "var(--color-text-muted)" }}>({form.code})</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={tsearch}
                    onChange={(e) => setTsearch(e.target.value)}
                    placeholder={t("admin.searchTranslationPlaceholder")}
                    className="px-4 py-2 rounded-xl text-sm border flex-1 min-w-[200px]"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder={t("admin.translationNewKeyPlaceholder")}
                      dir="ltr"
                      className="px-4 py-2 rounded-xl text-sm border"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={t("admin.translationValuePlaceholder")}
                      dir={form.is_rtl ? "rtl" : "ltr"}
                      className="px-4 py-2 rounded-xl text-sm border"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    />
                    <button onClick={addTranslationKey} disabled={savingKey === -1} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--color-primary)" }}>
                      + {t("common.add")}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
                  <div className="overflow-auto max-h-[50vh]">
                    <table className="w-full">
                      <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.translationKey")}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{form.code}</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                        </tr>
                      </thead>
                      <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                        {filteredTranslations.map((item) => (
                          <tr key={item.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                            <td className="px-4 py-2 font-mono text-xs whitespace-nowrap" style={{ color: "var(--color-primary)" }} dir="ltr">{item.key}</td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={tDraft[item.key] !== undefined ? tDraft[item.key] : (item.translations?.[form.code] || "")}
                                onChange={(e) => setTDraft((prev) => ({ ...prev, [item.key]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") saveTranslationValue(item); }}
                                dir={form.is_rtl ? "rtl" : "ltr"}
                                placeholder={t("admin.translationValuePlaceholder")}
                                className="w-full px-3 py-1.5 rounded-lg text-sm border"
                                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => saveTranslationValue(item)}
                                disabled={savingKey === item.id}
                                className="font-medium text-sm transition-colors"
                                style={{ color: savingKey === item.id ? "var(--color-text-muted)" : "var(--color-primary)" }}
                              >
                                {savingKey === item.id ? "..." : t("common.save")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
        ) : languages.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p>
        ) : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto">
              <table className="w-full">
                <thead style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.langCode")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.langName")}</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.langNativeName")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.langStatus")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {languages.map((lang) => (
                    <tr key={lang.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }} dir="ltr">{lang.code}</td>
                      <td className="px-6 py-4" style={{ color: "var(--color-text-secondary)" }}>{lang.name}</td>
                      <td className="col-hide-md px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>
                        <span className="mr-1">{lang.flag}</span> {lang.native_name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: lang.is_active ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)", color: lang.is_active ? "var(--color-success)" : "var(--color-text-muted)" }}>
                            {lang.is_active ? t("admin.langEnabled") : t("admin.langDisabled")}
                          </span>
                          {lang.is_default && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#D97706" }}>
                              {t("admin.langDefault")}
                            </span>
                          )}
                          {lang.is_rtl && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
                              RTL
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 items-center">
                          {!lang.is_default && (
                            <button onClick={() => setDefault(lang.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-text-muted)" }}>
                              {t("admin.langMakeDefault")}
                            </button>
                          )}
                          <button onClick={() => openEdit(lang)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                          <button onClick={() => openEdit(lang, "translations")} className="font-medium text-sm transition-colors" style={{ color: "var(--color-secondary, #7C3AED)" }}>{t("admin.langTranslationsTab")}</button>
                          <button onClick={() => handleDelete(lang.id, lang.is_default)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

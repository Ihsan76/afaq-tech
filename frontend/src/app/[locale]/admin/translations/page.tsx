"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useApiList } from "@/lib/useApi";
import { useAdminLanguages } from "@/lib/useLanguages";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface TranslationItem {
  id: number;
  key: string;
  namespace: string;
  translations: Record<string, string>;
  is_active: boolean;
  order: number;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
const fieldStyle = { borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" };

export default function AdminTranslationsPage() {
  const t = useTranslations();
  const { languages } = useAdminLanguages();
  const { data: items, loading, mutate } = useApiList<TranslationItem>("/core/admin/translations/");

  const [namespace, setNamespace] = useState("");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TranslationItem | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const namespaces = useMemo(() => {
    const set = new Set<string>();
    for (const item of items || []) if (item.namespace) set.add(item.namespace);
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    let list = items || [];
    if (namespace) list = list.filter((i) => i.namespace === namespace);
    if (query.trim()) list = list.filter((i) => i.key.toLowerCase().includes(query.trim().toLowerCase()));
    return list;
  }, [items, namespace, query]);

  const setValue = (code: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [code]: val }));
  };

  const openCreate = () => {
    const vals: Record<string, string> = {};
    for (const l of languages) vals[l.code] = "";
    setFormKey("");
    setFormValues(vals);
    setEditing(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item: TranslationItem) => {
    const vals: Record<string, string> = {};
    for (const l of languages) vals[l.code] = item.translations?.[l.code] || "";
    setFormKey(item.key);
    setFormValues(vals);
    setEditing(item);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = formKey.trim();
    if (!key) { setError(t("admin.translationKeyRequired")); return; }
    const translations: Record<string, string> = {};
    for (const [code, val] of Object.entries(formValues)) {
      if (val.trim()) translations[code] = val.trim();
    }
    const payload = { key, translations };
    try {
      if (editing) await api.patch(`/core/admin/translations/${editing.id}/`, payload);
      else await api.post("/core/admin/translations/create/", payload);
      setShowForm(false);
      setError("");
      mutate();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : t("common.error"));
    }
  };

  const handleDelete = async (item: TranslationItem) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/core/admin/translations/${item.id}/delete/`);
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.error"));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.translations")}</h1>
          <button onClick={openCreate} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            + {t("common.add")}
          </button>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          {t("admin.translationsDesc")}
        </p>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {editing ? t("admin.editTranslation") : t("admin.addTranslation")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.translationKey")}</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  disabled={!!editing}
                  placeholder="nav.home, common.save ..."
                  dir="ltr"
                  className={inputCls}
                  style={fieldStyle}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {languages.map((lang) => (
                  <div key={lang.code}>
                    <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                      {lang.flag} {lang.native_name || lang.name} <span dir="ltr" style={{ color: "var(--color-text-muted)" }}>({lang.code})</span>
                    </label>
                    <textarea
                      value={formValues[lang.code] || ""}
                      onChange={(e) => setValue(lang.code, e.target.value)}
                      rows={2}
                      dir={lang.is_rtl ? "rtl" : "ltr"}
                      className={inputCls}
                      style={fieldStyle}
                    />
                  </div>
                ))}
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
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchTranslationPlaceholder")}
            className="px-4 py-2 rounded-xl text-sm border flex-1 min-w-[200px]"
            style={fieldStyle}
          />
          <SelectDropdown value={namespace} onChange={(v) => setNamespace(String(v))} className="px-4 py-2 rounded-xl text-sm border" style={fieldStyle}>
            <option value="">{t("admin.translationAllNamespaces")}</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </SelectDropdown>
        </div>

        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p>
        ) : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.translationKey")}</th>
                    {languages.map((lang) => (
                      <th key={lang.code} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                        {lang.code}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {filtered.map((item) => (
                    <tr key={item.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap" style={{ color: "var(--color-primary)" }} dir="ltr">{item.key}</td>
                      {languages.map((lang) => (
                        <td key={lang.code} className="px-4 py-2 text-sm max-w-[220px]" style={{ color: "var(--color-text)" }} dir={lang.is_rtl ? "rtl" : "ltr"}>
                          <span className="line-clamp-2">{item.translations?.[lang.code] || <span style={{ color: "var(--color-text-muted)" }}>—</span>}</span>
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(item)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                          <button onClick={() => handleDelete(item)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
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

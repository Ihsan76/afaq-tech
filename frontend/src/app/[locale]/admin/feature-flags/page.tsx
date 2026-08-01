"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useApiList } from "@/lib/useApi";

interface FeatureFlagItem {
  id: number;
  key: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
const fieldStyle = { borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" };

export default function AdminFeatureFlagsPage() {
  const t = useTranslations();
  const { data: flags, loading, mutate } = useApiList<FeatureFlagItem>("/core/admin/feature-flags/");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FeatureFlagItem | null>(null);
  const [form, setForm] = useState({ key: "", name: "", description: "", is_active: true });
  const [error, setError] = useState("");

  const openCreate = () => {
    setForm({ key: "", name: "", description: "", is_active: true });
    setEditing(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (item: FeatureFlagItem) => {
    setForm({ key: item.key, name: item.name, description: item.description || "", is_active: item.is_active });
    setEditing(item);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key.trim()) { setError(t("admin.featureFlagKeyRequired")); return; }
    const payload = {
      key: form.key.trim(),
      name: form.name.trim() || form.key.trim(),
      description: form.description.trim(),
      is_active: form.is_active,
    };
    try {
      if (editing) await api.patch(`/core/admin/feature-flags/${editing.id}/`, payload);
      else await api.post("/core/admin/feature-flags/create/", payload);
      setShowForm(false);
      setError("");
      mutate();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : t("common.error"));
    }
  };

  const toggleActive = async (item: FeatureFlagItem) => {
    try {
      await api.patch(`/core/admin/feature-flags/${item.id}/`, { is_active: !item.is_active });
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.error"));
    }
  };

  const handleDelete = async (item: FeatureFlagItem) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try {
      await api.delete(`/core/admin/feature-flags/${item.id}/delete/`);
      mutate();
    } catch (err: any) {
      setError(err.response?.data?.error || t("common.error"));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.featureFlags")}</h1>
          <button onClick={openCreate} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            + {t("admin.addFeatureFlag")}
          </button>
        </div>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          {t("admin.featureFlagsDesc")}
        </p>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {editing ? t("admin.editFeatureFlag") : t("admin.addFeatureFlag")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featureFlagKey")}</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  disabled={!!editing}
                  placeholder="ai_assistant, courses, gamification ..."
                  dir="ltr"
                  className={inputCls}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featureFlagName")}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featureFlagDescription")}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={inputCls}
                  style={fieldStyle}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featureFlagActive")}</span>
              </label>
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

        {loading ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
        ) : (flags || []).length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p>
        ) : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.featureFlagKey")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.featureFlagName")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>{t("admin.featureFlagDescription")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.featureFlagActive")}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "var(--color-primary)" }} dir="ltr">{item.key}</td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--color-text)" }}>{item.name}</td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>{item.description || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${item.is_active ? "" : "opacity-60"}`}
                        style={
                          item.is_active
                            ? { background: "rgba(34,197,94,0.15)", color: "var(--color-success, #16A34A)", borderColor: "rgba(34,197,94,0.4)" }
                            : { background: "rgba(239,68,68,0.1)", color: "var(--color-error)", borderColor: "rgba(239,68,68,0.3)" }
                        }
                      >
                        {item.is_active ? "✓" : "✕"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
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
        )}
      </div>
    </div>
  );
}

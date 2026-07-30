"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface Template {
  id: number; translations: Record<string, { name: string; description?: string }>;
  name?: string; description?: string; slug: string;
  category: string; thumbnail: string; is_active: boolean;
}

const LANGUAGES = [
  { code: "ar", label: "العربية" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "tr", label: "Türkçe" },
  { code: "ur", label: "اردو" }, { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" }, { code: "id", label: "Bahasa Indonesia" },
  { code: "bn", label: "বাংলা" },
];
const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

export default function AdminTemplatesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("landing");
  const [nameTranslations, setNameTranslations] = useState<Record<string, string>>({});
  const [descTranslations, setDescTranslations] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("ar");
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  useEffect(() => {
    setNameInput(nameTranslations[selectedLang] || "");
    setDescInput(descTranslations[selectedLang] || "");
  }, [selectedLang, nameTranslations, descTranslations]);

  const fetchTemplates = async () => {
    try { const res = await api.get("/pages/admin/templates/"); setTemplates(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameTranslations["ar"]?.trim()) { setError("الاسم بالعربية مطلوب"); return; }
    try {
      const translations: Record<string, { name: string; description?: string }> = {};
      for (const lang of LANGUAGES) {
        const entry: { name: string; description?: string } = { name: nameTranslations[lang.code]?.trim() || "" };
        if (descTranslations[lang.code]?.trim()) entry.description = descTranslations[lang.code].trim();
        translations[lang] = entry;
      }
      await api.post("/pages/admin/templates/create/", {
        translations, slug, category, default_blocks: [], default_layout: {},
      });
      setShowForm(false); setSlug(""); setNameTranslations({}); setDescTranslations({});
      setSelectedLang("ar"); setNameInput(""); setDescInput(""); setError(""); fetchTemplates();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/pages/admin/templates/${id}/delete/`); fetchTemplates(); } catch {}
  };

  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const surface = { background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" };

  const CATEGORIES: Record<string, string> = {
    landing: t("admin.templateCatLanding"),
    business: t("admin.templateCatBusiness"),
    education: t("admin.templateCatEducation"),
    portfolio: t("admin.templateCatPortfolio"),
    custom: t("admin.templateCatCustom"),
  };
  const CATEGORY_ICONS: Record<string, string> = {
    landing: "📄", business: "💼", education: "🎓", portfolio: "🖼️", custom: "📝",
  };

  const nameFilled = LANGUAGES.filter(l => nameTranslations[l.code]?.trim()).length;
  const descFilled = LANGUAGES.filter(l => descTranslations[l.code]?.trim()).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.templates")}</h1>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all" style={{ background: "var(--btn-primary-bg)" }}>+ {t("admin.createTemplate")}</button>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.newTemplate")}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} style={style} required placeholder="landing-page" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.description")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} style={style}>
                {Object.entries(CATEGORIES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 items-end mb-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
              <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}
                className={inputCls} style={style}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label} {nameTranslations[l.code]?.trim() ? "✅" : ""}</option>
                ))}
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({LANGUAGES.find(l => l.code === selectedLang)?.label})</label>
              <input type="text" value={nameInput} onChange={(e) => { setNameInput(e.target.value); setNameTranslations(prev => ({ ...prev, [selectedLang]: e.target.value })); }}
                className={inputCls} style={style} dir={selectedLang === "ar" || selectedLang === "ur" ? "rtl" : "ltr"} />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {LANGUAGES.map(l => (
              <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${nameTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                onClick={() => setSelectedLang(l.code)}>{l.code} {nameTranslations[l.code]?.trim() ? "✓" : ""}</span>
            ))}
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>الاسم: {nameFilled}/{LANGUAGES.length}</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.description")} ({LANGUAGES.find(l => l.code === selectedLang)?.label})</label>
            <textarea value={descInput} onChange={(e) => { setDescInput(e.target.value); setDescTranslations(prev => ({ ...prev, [selectedLang]: e.target.value })); }}
              className={inputCls + " resize-none"} style={style} rows={2} dir={selectedLang === "ar" || selectedLang === "ur" ? "rtl" : "ltr"} />
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>الوصف: {descFilled}/{LANGUAGES.length}</p>

          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white" style={{ background: "var(--btn-primary-bg)" }}>{t("admin.createPage")}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold border" style={style}>{t("common.cancel")}</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-lg mb-2" style={{ color: "var(--color-text-muted)" }}>{t("admin.noTemplates")}</p>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{t("admin.noTemplatesHint")}</p>
          <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>+ {t("admin.createTemplate")}</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
              <div className="h-32 flex items-center justify-center" style={{ background: "var(--color-surface-alt)" }}>
                <span className="text-4xl">{CATEGORY_ICONS[tpl.category] || "📝"}</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{tpl.translations?.ar?.name || tpl.name || tpl.slug}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{CATEGORIES[tpl.category] || tpl.category}</span>
                </div>
                {tpl.translations?.en?.name && <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>{tpl.translations.en.name}</p>}
                {tpl.translations?.ar?.description && <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{tpl.translations.ar.description}</p>}
                <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>/{tpl.slug}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(tpl.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-error)" }}>{t("common.delete")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

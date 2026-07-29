"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface Template {
  id: number; name_en: string; name_ar: string; slug: string;
  category: string; description_en: string; description_ar: string;
  thumbnail: string; is_active: boolean;
}

export default function AdminTemplatesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("landing");
  const [descEn, setDescEn] = useState("");
  const [descAr, setDescAr] = useState("");

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try { const res = await api.get("/pages/admin/templates/"); setTemplates(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pages/admin/templates/create/", {
        name_en: nameEn, name_ar: nameAr, slug, category,
        description_en: descEn, description_ar: descAr, default_blocks: [], default_layout: {},
      });
      setShowForm(false); setNameEn(""); setNameAr(""); setSlug(""); setDescEn(""); setDescAr(""); fetchTemplates();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/pages/admin/templates/${id}/delete/`); fetchTemplates(); } catch {}
  };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.templates")}</h1>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all" style={{ background: "var(--btn-primary-bg)" }}>+ {t("admin.createTemplate")}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.newTemplate")}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.titleEn")}</label>
              <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} style={style} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.titleAr")}</label>
              <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} style={style} required />
            </div>
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
                  <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{tpl.name_ar}</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{CATEGORIES[tpl.category] || tpl.category}</span>
                </div>
                {tpl.name_en && <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>{tpl.name_en}</p>}
                {tpl.description_ar && <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>{tpl.description_ar}</p>}
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

"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";

interface EbookCategory {
  id: number; translations: Record<string, Record<string, string>>; slug: string; icon: string;
}

interface Ebook {
  id: number; slug: string; translations: Record<string, Record<string, string>>;
  category: number | null; cover_image: string; file_url: string; preview_url: string;
  pages_count: number; file_size: string; file_format: string;
  is_published: boolean; is_featured: boolean; access_level: string;
  download_count: number; tags: string; published_at: string | null;
}

const ACCESS_LEVELS = [
  { value: "free", label: "Free / مجاني", icon: "✓" },
  { value: "basic", label: "Basic / أساسي", icon: "⭐" },
  { value: "pro", label: "Pro / برو", icon: "👑" },
  { value: "enterprise", label: "Enterprise / مؤسسي", icon: "🏢" },
];

export default function AdminEbooksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<EbookCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [dirty, setDirty] = useState(false);

  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});
  const [formLocale, setFormLocale] = useState<string>(locale);
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const [formFileUrl, setFormFileUrl] = useState("");
  const [formPreviewUrl, setFormPreviewUrl] = useState("");
  const [formPagesCount, setFormPagesCount] = useState(0);
  const [formFileSize, setFormFileSize] = useState("");
  const [formFileFormat, setFormFileFormat] = useState("PDF");
  const [formIsPublished, setFormIsPublished] = useState(false);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formAccessLevel, setFormAccessLevel] = useState("free");
  const [formTags, setFormTags] = useState("");

  useEffect(() => { fetchEbooks(); fetchCategories(); }, []);

  const fetchEbooks = async () => {
    try {
      const res = await api.get("/ebooks/admin/list/");
      setEbooks(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/ebooks/categories/");
      setCategories(res.data.results || res.data);
    } catch {}
  };

  const resetForm = () => {
    setFormTranslations({}); setFormSlug(""); setFormCategory(""); setFormCoverImage("");
    setFormFileUrl(""); setFormPreviewUrl(""); setFormPagesCount(0); setFormFileSize("");
    setFormFileFormat("PDF"); setFormIsPublished(false); setFormIsFeatured(false);
    setFormAccessLevel("free"); setFormTags("");
    setEditingEbook(null); setShowForm(false); setDirty(false);
  };

  const openEdit = (ebook: Ebook) => {
    const doOpen = () => {
      setEditingEbook(ebook);
      setFormTranslations(ebook.translations || {});
      setFormSlug(ebook.slug); setFormCategory(ebook.category || "");
      setFormCoverImage(ebook.cover_image); setFormFileUrl(ebook.file_url);
      setFormPreviewUrl(ebook.preview_url); setFormPagesCount(ebook.pages_count);
      setFormFileSize(ebook.file_size); setFormFileFormat(ebook.file_format);
      setFormIsPublished(ebook.is_published); setFormIsFeatured(ebook.is_featured);
      setFormAccessLevel(ebook.access_level); setFormTags(ebook.tags || "");
      setShowForm(true); setDirty(false);
    };
    confirmIfDirty(doOpen);
  };

  const updateTranslation = (loc: string, field: string, value: string) => {
    setFormTranslations((prev) => ({ ...prev, [loc]: { ...(prev[loc] || {}), [field]: value } }));
    setDirty(true);
  };

  const markDirty = () => setDirty(true);

  const confirmIfDirty = (action: () => void) => {
    if (dirty && !confirm(t("admin.confirmUnsaved"))) return;
    action();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      translations: formTranslations, slug: formSlug, category: formCategory || null,
      cover_image: formCoverImage, file_url: formFileUrl, preview_url: formPreviewUrl,
      pages_count: formPagesCount, file_size: formFileSize, file_format: formFileFormat,
      is_published: formIsPublished, is_featured: formIsFeatured, access_level: formAccessLevel,
      tags: formTags,
    };
    try {
      if (editingEbook) {
        await api.put(`/ebooks/admin/${editingEbook.id}/`, payload);
      } else {
        await api.post("/ebooks/admin/create/", payload);
      }
      resetForm(); fetchEbooks();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.confirmDeletePost"))) return;
    try { await api.delete(`/ebooks/admin/${id}/delete/`); fetchEbooks(); } catch {}
  };

  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const isRtl = formLocale === "ar" || formLocale === "ur";

  const getCategoryName = (cat: EbookCategory) => localized(cat.translations, locale, "name");

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.ebooks")} ({ebooks.length})
        </h1>
        <button onClick={() => confirmIfDirty(() => { resetForm(); setShowForm(true); })}
          className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
          style={{ background: "var(--btn-primary-bg)" }}>
          + {t("admin.newEbook")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              {editingEbook ? t("admin.editEbook") : t("admin.newEbook")}
            </h2>
            {dirty && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>{t("admin.unsaved")}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
            <select value={formLocale} onChange={(e) => setFormLocale(e.target.value)} className={inputCls + " max-w-xs"} style={style}>
              {locales.map((loc) => <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>)}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({formLocale.toUpperCase()})</label>
              <input value={formTranslations[formLocale]?.title || ""} onChange={(e) => { updateTranslation(formLocale, "title", e.target.value); if (!editingEbook) setFormSlug(autoSlug(e.target.value)); }}
                className={inputCls} style={style} dir={isRtl ? "rtl" : "ltr"} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
              <input value={formSlug} onChange={(e) => { setFormSlug(e.target.value); markDirty(); }} className={inputCls} style={style} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.description")} ({formLocale.toUpperCase()})</label>
              <textarea value={formTranslations[formLocale]?.description || ""} onChange={(e) => updateTranslation(formLocale, "description", e.target.value)} className={inputCls + " h-16"} style={style} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.category")}</label>
              <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value ? Number(e.target.value) : ""); markDirty(); }} className={inputCls} style={style}>
                <option value="">— {t("common.none")} —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {getCategoryName(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.accessLevel")}</label>
              <select value={formAccessLevel} onChange={(e) => { setFormAccessLevel(e.target.value); markDirty(); }} className={inputCls} style={style}>
                {ACCESS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.icon} {t(`ebooks.${l.value}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.coverImage")}</label>
              <input value={formCoverImage} onChange={(e) => { setFormCoverImage(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fileUrl")}</label>
              <input value={formFileUrl} onChange={(e) => { setFormFileUrl(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.previewUrl")}</label>
              <input value={formPreviewUrl} onChange={(e) => { setFormPreviewUrl(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.pagesCount")}</label>
              <input type="number" value={formPagesCount} onChange={(e) => { setFormPagesCount(Number(e.target.value)); markDirty(); }} className={inputCls} style={style} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fileSize")}</label>
              <input value={formFileSize} onChange={(e) => { setFormFileSize(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="5.2 MB" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fileFormat")}</label>
              <input value={formFileFormat} onChange={(e) => { setFormFileFormat(e.target.value); markDirty(); }} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.tags")}</label>
              <input value={formTags} onChange={(e) => { setFormTags(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder={t("admin.tagsPlaceholder")} />
            </div>
            <div className="flex items-center gap-6 pt-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formIsPublished} onChange={(e) => { setFormIsPublished(e.target.checked); markDirty(); }} className="w-5 h-5 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.published")}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formIsFeatured} onChange={(e) => { setFormIsFeatured(e.target.checked); markDirty(); }} className="w-5 h-5 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featured")}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {locales.map((loc) => {
              const has = !!formTranslations[loc]?.title;
              return (
                <span key={loc} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: has ? "var(--color-success-light)" : "var(--color-surface-alt)", color: has ? "var(--color-success)" : "var(--color-text-muted)" }}>
                  {localeNames[loc]} {has ? "✓" : "—"}
                </span>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all" style={{ background: "var(--btn-primary-bg)" }}>
              {editingEbook ? t("admin.saveChanges") : t("admin.publishPost")}
            </button>
            {editingEbook && (
              <button type="button" onClick={() => { if (confirm(t("admin.confirmDeletePost"))) { handleDelete(editingEbook.id); resetForm(); } }}
                className="px-5 py-2.5 rounded-xl font-semibold border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-all ml-auto">
                {t("common.delete")}
              </button>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : ebooks.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ ...style }}>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>{t("ebooks.noEbooks")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-4 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")}</th>
                <th className="col-hide-md px-4 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.category")}</th>
                <th className="col-hide-md px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.accessLevel")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.status")}</th>
                <th className="col-hide-sm px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("ebooks.downloads")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {ebooks.map((ebook) => {
                const cat = categories.find((c) => c.id === ebook.category);
                return (
                  <tr key={ebook.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-4">
                      <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                        {localized(ebook.translations, locale, "title")} {ebook.is_featured && <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>★</span>}
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>/ebooks/{ebook.slug}</div>
                    </td>
                    <td className="col-hide-md px-4 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {cat ? `${cat.icon} ${getCategoryName(cat)}` : "—"}
                    </td>
                    <td className="col-hide-md px-4 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                        background: ebook.access_level === "free" ? "var(--color-success-light)" : ebook.access_level === "basic" ? "var(--color-info-light, #e0f2fe)" : "var(--color-warning-light)",
                        color: ebook.access_level === "free" ? "var(--color-success)" : ebook.access_level === "basic" ? "var(--color-info, #0284c7)" : "var(--color-warning)"
                      }}>
                        {ACCESS_LEVELS.find((l) => l.value === ebook.access_level)?.icon} {t(`ebooks.${ebook.access_level}`)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                        background: ebook.is_published ? "var(--color-success-light)" : "var(--color-surface-alt)",
                        color: ebook.is_published ? "var(--color-success)" : "var(--color-text-muted)"
                      }}>
                        {ebook.is_published ? t("admin.published") : t("admin.draft")}
                      </span>
                    </td>
                    <td className="col-hide-sm px-4 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{ebook.download_count}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEdit(ebook)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button onClick={() => handleDelete(ebook.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-error)" }}>{t("common.delete")}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

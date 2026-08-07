"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface BlogCategory {
  id: number; translations: Record<string, Record<string, string>>; slug: string;
}

interface BlogPost {
  id: number; translations: Record<string, Record<string, string>>; slug: string;
  category: number | null;
  category_name: Record<string, Record<string, string>> | null;
  tags?: string; related_service?: string;
  is_featured: boolean; read_time: number; views: number;
  published_at: string | null;
}

export default function AdminBlogPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [dirty, setDirty] = useState(false);

  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});
  const [formLocale, setFormLocale] = useState<string>(locale);
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formTags, setFormTags] = useState("");
  const [formReadTime, setFormReadTime] = useState(3);
  const [formRelatedService, setFormRelatedService] = useState("");
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formImage, setFormImage] = useState("");
  const [formAvatar, setFormAvatar] = useState("");

  useEffect(() => { fetchPosts(); fetchCategories(); }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get("/blog/admin/posts/");
      setPosts(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/blog/admin/categories/");
      setCategories(res.data.results || res.data);
    } catch {}
  };

  const resetForm = () => {
    setFormTranslations({});
    setFormSlug(""); setFormCategory(""); setFormTags(""); setFormReadTime(3);
    setFormRelatedService(""); setFormIsFeatured(false);
    setFormImage(""); setFormAvatar("");
    setEditingPost(null); setShowForm(false); setDirty(false);
  };

  const openEdit = (post: BlogPost) => {
    const doOpen = () => {
      setEditingPost(post);
      const trans = { ...(post.translations || {}) };
      const authorTrans = (post as any).author_translations || {};
      Object.keys(authorTrans).forEach((loc) => {
        if (!trans[loc]) trans[loc] = {};
        (trans[loc] as any).author_name = authorTrans[loc]?.author_name || "";
      });
      setFormTranslations(trans);
      setFormSlug(post.slug);
      setFormCategory(post.category || ""); setFormTags(post.tags || "");
      setFormReadTime(post.read_time); setFormRelatedService(post.related_service || "");
      setFormIsFeatured(post.is_featured);
      setFormImage((post as any).featured_image || "");
      setFormAvatar((post as any).author_avatar || "");
      setShowForm(true); setDirty(false);
    };
    confirmIfDirty(doOpen);
  };

  const updateTranslation = (loc: string, field: string, value: string) => {
    setFormTranslations((prev) => ({
      ...prev,
      [loc]: { ...(prev[loc] || {}), [field]: value },
    }));
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
      translations: (() => {
        const t = { ...formTranslations };
        Object.keys(t).forEach((loc) => { delete t[loc].author_name; });
        return t;
      })(),
      author_translations: Object.fromEntries(
        Object.entries(formTranslations).map(([loc, fields]) => [
          loc,
          { author_name: (fields as any).author_name || "" },
        ])
      ),
      slug: formSlug,
      category: formCategory || null,
      tags: formTags,
      read_time: formReadTime,
      related_service: formRelatedService,
      is_featured: formIsFeatured,
      featured_image: formImage,
      author_avatar: formAvatar,
    };
    try {
      if (editingPost) {
        await api.put(`/blog/admin/posts/${editingPost.id}/`, payload);
      } else {
        await api.post("/blog/admin/posts/create/", payload);
      }
      resetForm(); fetchPosts();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.confirmDeletePost"))) return;
    try { await api.delete(`/blog/admin/posts/${id}/`); fetchPosts(); } catch {}
  };

  const autoSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const isRtl = formLocale === "ar" || formLocale === "ur";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.blog")} ({posts.length})
        </h1>
        <div className="flex gap-2">
          <button onClick={() => confirmIfDirty(() => { resetForm(); setShowForm(true); })}
            className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: "var(--btn-primary-bg)" }}>
            + {t("admin.newPost") || "New Post"}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              {editingPost ? t("admin.editPost") : t("admin.newPost")}
            </h2>
            {dirty && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>{t("admin.unsaved")}</span>}
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
            <select value={formLocale} onChange={(e) => setFormLocale(e.target.value)} className={inputCls + " max-w-xs"} style={style}>
              {locales.map((loc) => (
                <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {/* Translation fields — current locale only */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({formLocale.toUpperCase()})</label>
              <input value={formTranslations[formLocale]?.title || ""} onChange={(e) => { updateTranslation(formLocale, "title", e.target.value); if (!editingPost) setFormSlug(autoSlug(e.target.value)); }}
                className={inputCls} style={style} dir={isRtl ? "rtl" : "ltr"} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
              <input value={formSlug} onChange={(e) => { setFormSlug(e.target.value); markDirty(); }} className={inputCls} style={style} required placeholder="my-post-slug" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.category") || "Category"}</label>
              <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value ? Number(e.target.value) : ""); markDirty(); }} className={inputCls} style={style}>
                <option value="">{t("common.none")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{localized(c.translations, locale, "name")}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.excerptAr")}</label>
              <textarea value={formTranslations[formLocale]?.excerpt || ""} onChange={(e) => updateTranslation(formLocale, "excerpt", e.target.value)} className={inputCls + " h-16"} style={style} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.content")} ({formLocale.toUpperCase()})</label>
              <RichTextEditor value={formTranslations[formLocale]?.content || ""} onChange={(v) => updateTranslation(formLocale, "content", v)} placeholder={t("admin.contentPlaceholder")} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.tags")}</label>
              <input value={formTags} onChange={(e) => { setFormTags(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="tag1,tag2,tag3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.readTime") || "Read Time (min)"}</label>
              <input type="number" value={formReadTime} onChange={(e) => { setFormReadTime(Number(e.target.value)); markDirty(); }} className={inputCls} style={style} min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.author")} ({formLocale.toUpperCase()})</label>
              <input value={formTranslations[formLocale]?.author_name || ""} onChange={(e) => updateTranslation(formLocale, "author_name", e.target.value)} className={inputCls} style={style} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.relatedService") || "Related Service URL"}</label>
              <input value={formRelatedService} onChange={(e) => { setFormRelatedService(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="/services/web-design" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={formIsFeatured} onChange={(e) => { setFormIsFeatured(e.target.checked); markDirty(); }} id="featured" className="w-5 h-5 rounded" />
              <label htmlFor="featured" className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featured") || "Featured"}</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featuredImage")}</label>
              <input value={formImage} onChange={(e) => { setFormImage(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://images.unsplash.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.authorAvatar")}</label>
              <input value={formAvatar} onChange={(e) => { setFormAvatar(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://..." />
            </div>
          </div>

          {/* Locale badges — show which locales have data */}
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
              {editingPost ? t("admin.saveChanges") : t("admin.publishPost")}
            </button>
            {editingPost && (
              <button type="button" onClick={() => { if (confirm(t("admin.confirmDeletePost"))) { handleDelete(editingPost.id); resetForm(); } }}
                className="px-5 py-2.5 rounded-xl font-semibold border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-all ml-auto">
                {t("common.delete")}
              </button>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ ...style }}>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>{t("admin.noPosts")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="hidden sm:table-cell px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}></th>
                <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title") || "Title"}</th>
                <th className="hidden md:table-cell px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.category") || "Category"}</th>
                <th className="hidden md:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.readTime") || "Read"}</th>
                <th className="hidden sm:table-cell px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.views") || "Views"}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                  <td className="hidden sm:table-cell px-6 py-4">
                    {(post as any).featured_image ? (
                      <img src={(post as any).featured_image} alt="" className="w-16 h-10 rounded-lg object-cover" style={{ border: "1px solid var(--color-border)" }} />
                    ) : (
                      <div className="w-16 h-10 rounded-lg flex items-center justify-center text-xs" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>—</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                      {localized(post.translations, locale, "title")} {post.is_featured && <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>★</span>}
                    </div>
                    {Object.keys(post.translations || {}).length > 1 && (
                      <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {Object.keys(post.translations).filter((l) => l !== locale && post.translations[l]?.title).map((l) => `${localeNames[l]}: ${post.translations[l].title}`).join(" | ")}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>/blog/{post.slug}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {post.category_name ? localized(post.category_name, locale, "name") : "—"}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{post.read_time}m</td>
                  <td className="hidden sm:table-cell px-6 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{post.views}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEdit(post)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{t("common.edit")}</button>
                      <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-error)" }}>{t("common.delete")}</button>
                    </div>
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

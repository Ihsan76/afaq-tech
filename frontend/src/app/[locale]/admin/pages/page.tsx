"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";
import dynamic from "next/dynamic";
import { BLOCK_TYPES, TEMPLATE_ICONS } from "@/lib/blockTypes";

const PageBlockPreview = dynamic(() => import("@/components/landing/PageBlockPreview"), { ssr: false });

interface Page {
  id: number; slug: string; translations: Record<string, Record<string, string>>;
  template: string; is_published: boolean; is_homepage: boolean;
  show_in_nav: boolean; nav_order: number; nav_icon: string;
  blocks_count: number; created_at: string; updated_at: string;
}

interface Block {
  id: number; block_type: string;
  content: any; styles: any; layout: any; animation: any;
  is_active: boolean; order: number;
}

export default function AdminPagesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();

  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [slug, setSlug] = useState("");
  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});
  const [formLocale, setFormLocale] = useState(locale);
  const [template, setTemplate] = useState("default");

  const [previewPage, setPreviewPage] = useState<Page | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<Block[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    try { const res = await api.get("/pages/admin/pages/"); setPages(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pages/admin/pages/create/", { slug, translations: formTranslations, template });
      setShowForm(false); setSlug(""); setFormTranslations({}); setTemplate("default"); fetchPages();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.confirmDeletePage"))) return;
    try { await api.delete(`/pages/admin/pages/${id}/delete/`); if (previewPage?.id === id) { setPreviewPage(null); setPreviewBlocks([]); } fetchPages(); } catch {}
  };

  const handleSelectPage = async (page: Page) => {
    if (previewPage?.id === page.id) {
      setPreviewPage(null);
      setPreviewBlocks([]);
      return;
    }
    setPreviewPage(page);
    setPreviewLoading(true);
    try {
      const res = await api.get(`/pages/admin/pages/${page.id}/blocks/`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPreviewBlocks(data.sort((a: Block, b: Block) => a.order - b.order));
    } catch {} finally { setPreviewLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const formStyle = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const isRtl = formLocale === "ar" || formLocale === "ur";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.pages")}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{t("admin.selectPageHint")}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
            + {t("admin.pages")}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className={`${previewPage ? "lg:w-1/2" : "w-full"} transition-all`}>
            {isLoading ? (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-lg mb-2" style={{ color: "var(--color-text-muted)" }}>{t("admin.noPages")}</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{t("admin.noPagesHint")}</p>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>+ {t("admin.createPage")}</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`rounded-3xl border-2 overflow-hidden transition-all cursor-pointer hover:-translate-y-1 ${
                      previewPage?.id === page.id ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{
                      borderColor: previewPage?.id === page.id ? "var(--color-primary)" : "var(--color-border)",
                      background: "var(--color-surface)",
                      boxShadow: "var(--card-shadow)",
                    }}
                    onClick={() => handleSelectPage(page)}
                  >
                    <div className="h-24 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` }}>
                      <span className="text-4xl drop-shadow-lg">{page.nav_icon || TEMPLATE_ICONS[page.template] || "📄"}</span>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {page.is_homepage && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--color-surface)]/90" style={{ color: "var(--color-primary)" }}>🏠 {t("admin.homepage")}</span>}
                        {page.is_published && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--color-surface)]/90 text-[var(--color-success)]">✓ {t("admin.published")}</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{localized(page.translations, locale, "title")}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>/{page.slug}</span>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{page.blocks_count} {t("admin.blocks")}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/admin/pages/${page.id}`); }}
                          className="flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all"
                          style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(page.id); }}
                          className="px-3 py-2 text-sm font-medium rounded-xl transition-all"
                          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-error)" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {previewPage && !showForm && (
            <div className="hidden lg:block w-[480px] flex-shrink-0">
              <div className="sticky top-8">
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--card-shadow)" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>👁️ {t("admin.livePreview")}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{TEMPLATE_ICONS[previewPage.template] || "📄"} {localized(previewPage.translations, locale, "title")}</span>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderRightColor: "transparent" }} />
                      </div>
                    ) : previewBlocks.length === 0 ? (
                      <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>
                        <p className="text-lg mb-2">📄</p>
                        <p className="text-sm">{t("admin.noBlocks")}</p>
                      </div>
                    ) : (
                      <PageBlockPreview blocks={previewBlocks} />
                    )}
                  </div>
                  <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "var(--color-border)" }}>
                    <button onClick={() => router.push(`/${locale}/admin/pages/${previewPage.id}`)} className="flex-1 px-3 py-2 text-sm font-medium rounded-xl" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{t("common.edit")}</button>
                    <button onClick={() => setPreviewPage(null)} className="px-3 py-2 text-sm font-medium rounded-xl" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>✕</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Page Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg max-h-[85vh] rounded-3xl overflow-hidden flex flex-col" style={{ background: "var(--color-surface)" }}>
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>{t("admin.newPage")}</h3>
              <button onClick={() => setShowForm(false)} className="text-xl" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} style={formStyle} required placeholder="about" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
                  <select value={formLocale} onChange={(e) => setFormLocale(e.target.value)} className={inputCls} style={formStyle}>
                    {locales.map((loc) => (
                      <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({formLocale.toUpperCase()})</label>
                  <input
                    value={formTranslations[formLocale]?.title || ""}
                    onChange={(e) => setFormTranslations((prev) => ({ ...prev, [formLocale]: { ...(prev[formLocale] || {}), title: e.target.value } }))}
                    className={inputCls} style={formStyle} dir={isRtl ? "rtl" : "ltr"} required
                  />
                </div>
                {/* Locale badges */}
                <div className="flex flex-wrap gap-1">
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
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.template")}</label>
                  <select value={template} onChange={(e) => setTemplate(e.target.value)} className={inputCls} style={formStyle}>
                    <option value="default">Default</option>
                    <option value="landing">Landing</option>
                    <option value="about">About</option>
                    <option value="contact">Contact</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              <div className="p-5 border-t flex gap-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
                <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all text-sm" style={{ background: "var(--color-primary)" }}>{t("admin.createPage")}</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl font-semibold border text-sm" style={formStyle}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

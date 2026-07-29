"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import PageBlockPreview from "@/components/landing/PageBlockPreview";
import dynamic from "next/dynamic";
import { BLOCK_TYPES } from "@/lib/blockTypes";

const BlockEditorModal = dynamic(() => import("@/components/admin/BlockEditorModal"), { ssr: false });

interface Block {
  id: number; block_type: string;
  content: any; styles: any; layout: any; animation: any;
  is_active: boolean; order: number;
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const pageId = params.pageId as string;
  const t = useTranslations();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [pageInfo, setPageInfo] = useState<any>(null);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => { fetchBlocks(); }, [pageId]);

  const fetchBlocks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blocksRes, pageRes] = await Promise.all([
        api.get(`/pages/admin/pages/${pageId}/blocks/`),
        api.get(`/pages/admin/pages/${pageId}/`),
      ]);
      const blocksData = Array.isArray(blocksRes.data) ? blocksRes.data : (blocksRes.data.results || []);
      setBlocks(blocksData.sort((a: Block, b: Block) => a.order - b.order));
      setPageInfo(pageRes.data);
    } catch (err: any) {
      setError(err?.response?.status === 403 ? t("common.error") : err?.response?.status === 404 ? t("common.notFound") : t("common.error"));
    } finally { setIsLoading(false); }
  };

  const addBlock = async (blockType: string) => {
    setAddError(null);
    try {
      const info = BLOCK_TYPES[blockType];
      await api.post(`/pages/admin/pages/${pageId}/blocks/`, {
        block_type: blockType,
        order: blocks.length, is_active: true,
        content: {}, styles: {}, layout: {}, animation: {},
      });
      setShowLibrary(false); fetchBlocks();
    } catch (err: any) {
      const msg = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || "Failed";
      setAddError(msg);
    }
  };

  const toggleBlock = async (block: Block) => {
    try {
      await api.put(`/pages/admin/pages/${pageId}/blocks/${block.id}/`, { is_active: !block.is_active });
      fetchBlocks();
    } catch {}
  };

  const deleteBlock = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/pages/admin/pages/${pageId}/blocks/${id}/`); if (selectedBlock?.id === id) setSelectedBlock(null); fetchBlocks(); } catch {}
  };

  const moveBlock = async (index: number, direction: -1 | 1) => {
    const newBlocks = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    const order = newBlocks.map((b, i) => ({ id: b.id, order: i }));
    try {
      await api.put(`/pages/admin/pages/${pageId}/blocks/reorder/`, { order });
      setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
    } catch {}
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, moved);
    const order = newBlocks.map((b, i) => ({ id: b.id, order: i }));
    try {
      await api.put(`/pages/admin/pages/${pageId}/blocks/reorder/`, { order });
      setBlocks(newBlocks.map((b, i) => ({ ...b, order: i })));
    } catch {}
    setDraggedIndex(null);
  };

  const saveBlockFromModal = async (updated: Block) => {
    try {
      await api.put(`/pages/admin/pages/${pageId}/blocks/${updated.id}/`, {
        content: updated.content,
        styles: updated.styles,
        layout: updated.layout,
        is_active: updated.is_active,
      });
      setEditingBlock(null);
      fetchBlocks();
    } catch {}
  };

  const savePageSettings = async () => {
    if (!pageInfo) return;
    try {
      await api.put(`/pages/admin/pages/${pageId}/`, {
        title_en: pageInfo.title_en,
        title_ar: pageInfo.title_ar,
        slug: pageInfo.slug,
        description_en: pageInfo.description_en,
        description_ar: pageInfo.description_ar,
        is_published: pageInfo.is_published,
        is_homepage: pageInfo.is_homepage,
        show_in_nav: pageInfo.show_in_nav,
        nav_order: pageInfo.nav_order,
        nav_icon: pageInfo.nav_icon,
      });
      setShowPageSettings(false);
      fetchBlocks();
    } catch {}
  };

  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push(`/${locale}/admin/pages`)} className="p-2 rounded-xl border flex-shrink-0 hover:opacity-80" style={style}>←</button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{pageInfo?.title?.ar || pageInfo?.title?.en || t("admin.pageEditor")}</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>/{pageInfo?.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setShowPageSettings(true)} className="px-3 py-2 rounded-xl text-sm font-bold border" style={style}>⚙️ {t("admin.settings")}</button>
            <button onClick={() => setShowLibrary(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: "var(--color-primary)" }}>+ {t("admin.addBlock")}</button>
          </div>
        </div>

        {/* Main Content: Blocks List + Preview */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Blocks List */}
          <div className={`${editingBlock ? "lg:w-1/2" : "w-full"} transition-all`}>
            {isLoading ? (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
            ) : error ? (
              <div className="text-center py-16 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-lg mb-2" style={{ color: "var(--color-error)" }}>{error}</p>
                <button onClick={fetchBlocks} className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>{t("common.retry")}</button>
              </div>
            ) : blocks.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-lg mb-2" style={{ color: "var(--color-text-muted)" }}>{t("admin.emptyPage")}</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{t("admin.emptyPageHint")}</p>
                <button onClick={() => setShowLibrary(true)} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>+ {t("admin.addBlock")}</button>
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, index) => {
                  const info = BLOCK_TYPES[block.block_type] || { i18nKey: block.block_type, icon: "📦" };
                  const isSelected = selectedBlock?.id === block.id;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onClick={() => setSelectedBlock(isSelected ? null : block)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? "ring-2 ring-offset-2" : "hover:shadow-md"}`}
                      style={{
                        background: isSelected ? "var(--color-primary-light)" : "var(--color-surface)",
                        borderColor: isSelected ? "var(--color-primary)" : "var(--color-border)",
                        opacity: block.is_active ? 1 : 0.5,
                        boxShadow: "var(--card-shadow)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="cursor-grab text-xl opacity-30">⠿</span>
                        <span className="text-2xl">{info.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{t(info.i18nKey)}</div>
                          <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{block.content?.title?.ar || block.content?.title?.en || "—"}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); moveBlock(index, -1); }} className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs" style={style}>↑</button>
                          <button onClick={(e) => { e.stopPropagation(); moveBlock(index, 1); }} className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs" style={style}>↓</button>
                          <button onClick={(e) => { e.stopPropagation(); toggleBlock(block); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: block.is_active ? "var(--color-success-light)" : "var(--color-surface-alt)", color: block.is_active ? "var(--color-success)" : "var(--color-text-muted)" }}>●</button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingBlock(block); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white" style={{ background: "var(--color-primary)" }}>✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => setShowLibrary(true)} className="w-full p-4 rounded-2xl border-2 border-dashed text-center transition-all hover:opacity-80" style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
                  <span className="text-lg font-bold">+ {t("admin.addBlock")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Live Preview Panel */}
          {blocks.length > 0 && !editingBlock && (
            <div className="hidden lg:block w-[480px] flex-shrink-0">
              <div className="sticky top-8">
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--card-shadow)" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>👁️ {t("admin.livePreview")}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{blocks.length} {t("admin.blocks")}</span>
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto">
                    <PageBlockPreview blocks={blocks} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Editor Modal (Level 3) */}
      {editingBlock && (
        <BlockEditorModal
          block={editingBlock}
          pageBlocks={blocks}
          onSave={saveBlockFromModal}
          onClose={() => setEditingBlock(null)}
        />
      )}

      {/* Page Settings Modal */}
      {showPageSettings && pageInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-lg max-h-[85vh] rounded-3xl overflow-hidden flex flex-col" style={{ background: "var(--color-surface)" }}>
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>{t("admin.pageSettings") || "Page Settings"}</h3>
              <button onClick={() => setShowPageSettings(false)} className="text-xl" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.titleAr")}</label>
                <input value={pageInfo.title_ar || ""} onChange={(e) => setPageInfo({ ...pageInfo, title_ar: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.titleEn")}</label>
                <input value={pageInfo.title_en || ""} onChange={(e) => setPageInfo({ ...pageInfo, title_en: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
                <input value={pageInfo.slug || ""} onChange={(e) => setPageInfo({ ...pageInfo, slug: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("common.descriptionAr")}</label>
                <textarea value={pageInfo.description_ar || ""} onChange={(e) => setPageInfo({ ...pageInfo, description_ar: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm resize-none" rows={3} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pageInfo.is_published || false} onChange={(e) => setPageInfo({ ...pageInfo, is_published: e.target.checked })} className="rounded" />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t("admin.published")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pageInfo.show_in_nav || false} onChange={(e) => setPageInfo({ ...pageInfo, show_in_nav: e.target.checked })} className="rounded" />
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t("admin.showInNav")}</span>
                </label>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--color-text-secondary)" }}>{t("admin.navOrder")}</label>
                <input type="number" value={pageInfo.nav_order || 0} onChange={(e) => setPageInfo({ ...pageInfo, nav_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-xl text-sm" style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={savePageSettings} className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-all text-sm" style={{ background: "var(--color-primary)" }}>{t("common.save")}</button>
              <button onClick={() => setShowPageSettings(false)} className="px-4 py-2.5 rounded-xl font-semibold border text-sm" style={style}>{t("common.cancel")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Block Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden" style={{ background: "var(--color-surface)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>{t("admin.blockLibrary")}</h3>
              <button onClick={() => setShowLibrary(false)} className="text-xl" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[60vh] grid grid-cols-2 sm:grid-cols-3 gap-3">
              {addError && (
                <div className="col-span-full p-3 rounded-xl text-sm mb-2" style={{ background: "var(--color-error-light, #fee)", color: "var(--color-error, #d00)" }}>
                  {addError}
                  <button onClick={() => setAddError(null)} className="float-left ml-2 font-bold">✕</button>
                </div>
              )}
              {Object.entries(BLOCK_TYPES).map(([type, info]) => (
                <button key={type} onClick={() => addBlock(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all hover:-translate-y-0.5"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                  <span className="text-3xl">{info.icon}</span>
                  <span className="text-sm font-bold text-center" style={{ color: "var(--color-text)" }}>{t(info.i18nKey)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

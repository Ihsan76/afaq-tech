"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";

interface MenuItem {
  id: number; menu: string; translations: Record<string, Record<string, string>>;
  url: string; page: number | null; icon: string; order: number;
  is_active: boolean; badge: string; children: MenuItem[];
}

export default function AdminMenusPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuType, setMenuType] = useState("header");
  const [showForm, setShowForm] = useState(false);
  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});
  const [formLocale, setFormLocale] = useState(locale);
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [badge, setBadge] = useState("");

  const MENU_POSITIONS = [
    { value: "header", label: t("admin.menuHeader") },
    { value: "footer", label: t("admin.menuFooter") },
    { value: "sidebar", label: t("admin.menuSidebar") },
  ];

  useEffect(() => { fetchItems(); }, [menuType]);

  const fetchItems = async () => {
    try { const res = await api.get(`/pages/admin/menus/?menu=${menuType}`); setItems(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pages/admin/menus/create/", { menu: menuType, translations: formTranslations, url, icon, badge, order: items.length });
      resetForm(); fetchItems();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/pages/admin/menus/${id}/delete/`); fetchItems(); } catch {}
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    const order = newItems.map((b, i) => ({ id: b.id, order: i }));
    try {
      await api.put("/pages/admin/menus/reorder/", { order, menu: menuType });
      setItems(newItems.map((b, i) => ({ ...b, order: i })));
    } catch {}
  };

  const resetForm = () => { setFormTranslations({}); setUrl(""); setIcon(""); setBadge(""); setShowForm(false); };
  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const isRtl = formLocale === "ar" || formLocale === "ur";
  const getLocaleTitle = (item: MenuItem) => localized(item.translations, locale, "title");

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.menus")}</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {MENU_POSITIONS.map((pos) => (
          <button key={pos.value} onClick={() => setMenuType(pos.value)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
            style={{
              background: menuType === pos.value ? "var(--color-primary)" : "var(--color-surface)",
              color: menuType === pos.value ? "var(--color-background)" : "var(--color-text-secondary)",
              border: `1px solid ${menuType === pos.value ? "var(--color-primary)" : "var(--color-border)"}`,
            }}>{pos.label}</button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{items.length} {t("admin.itemsCount")}</p>
        <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all self-start" style={{ background: "var(--btn-primary-bg)" }}>+ {t("admin.addMenuItem")}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.newMenuItem")}</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
              <select value={formLocale} onChange={(e) => setFormLocale(e.target.value)} className={inputCls} style={style}>
                {locales.map((loc) => (
                  <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({formLocale.toUpperCase()})</label>
              <input
                value={formTranslations[formLocale]?.title || ""}
                onChange={(e) => setFormTranslations((prev) => ({ ...prev, [formLocale]: { ...(prev[formLocale] || {}), title: e.target.value } }))}
                className={inputCls} style={style} dir={isRtl ? "rtl" : "ltr"} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.url")}</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} className={inputCls} style={style} placeholder="/about" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("common.icon")}</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} style={style} placeholder="🏠" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.badge")}</label>
              <input value={badge} onChange={(e) => setBadge(e.target.value)} className={inputCls} style={style} placeholder={t("admin.badgePlaceholder")} />
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
          <div className="flex gap-3">
            <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold text-white" style={{ background: "var(--btn-primary-bg)" }}>{t("common.add")}</button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl font-semibold border" style={style}>{t("common.cancel")}</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ ...style }}>
          <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>{t("admin.noMenuItems")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
              <span className="cursor-grab text-lg opacity-30">⠿</span>
              <span className="text-xl">{item.icon || "🔗"}</span>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{getLocaleTitle(item)}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{item.url || ""}</div>
              </div>
              {item.badge && <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{item.badge}</span>}
              <div className="flex gap-1">
                <button onClick={() => moveItem(index, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs" style={style}>↑</button>
                <button onClick={() => moveItem(index, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs" style={style}>↓</button>
                <button onClick={() => handleDelete(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: "var(--color-error-light)", color: "var(--color-error)" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

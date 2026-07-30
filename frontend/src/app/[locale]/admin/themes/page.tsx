"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface ThemeData {
  id: number;
  display_name: string;
  display_description: string;
  icon: string;
  translations: Record<string, { name: string; description?: string }>;
  is_active: boolean;
  is_default: boolean;
  order: number;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  surface: string;
  surface_alt: string;
  text_color: string;
  text_secondary: string;
  text_muted: string;
  border_color: string;
  border_light: string;
  muted: string;
  btn_shape: string;
  btn_size: string;
  btn_shadow: string;
  btn_hover: string;
  card_radius: string;
  card_border: string;
  card_shadow: string;
  card_glass: boolean;
  font_heading: string;
  font_body: string;
  font_size: string;
  line_height: string;
}

const LANGUAGES = [
  { code: "ar", label: "العربية" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "tr", label: "Türkçe" },
  { code: "ur", label: "اردو" }, { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" }, { code: "id", label: "Bahasa Indonesia" },
  { code: "bn", label: "বাংলা" },
];
const EMPTY_THEME: Partial<ThemeData> = {
  display_name: "", display_description: "", icon: "🎨", translations: {},
  is_active: true, is_default: false, order: 0,
  primary: "#4F46E5", secondary: "#7C3AED", accent: "#6366F1",
  success: "#10B981", error: "#EF4444", warning: "#F59E0B",
  background: "#F8FAFC", surface: "#FFFFFF", surface_alt: "#F1F5F9",
  text_color: "#0F172A", text_secondary: "#475569", text_muted: "#94A3B8",
  border_color: "#E2E8F0", border_light: "#F1F5F9", muted: "#F1F5F9",
  btn_shape: "rounded", btn_size: "md", btn_shadow: "md", btn_hover: "scale",
  card_radius: "lg", card_border: "thin", card_shadow: "md", card_glass: true,
  font_heading: "'IBM Plex Sans Arabic', sans-serif", font_body: "'Noto Sans Arabic', sans-serif",
  font_size: "16px", line_height: "1.6",
};

function ThemeMiniPreview({ theme }: { theme: ThemeData }) {
  const r = { none: "0", sm: "6px", md: "12px", lg: "18px", full: "9999px" }[theme.card_radius] || "12px";
  const bPad = { none: "0 0", sm: "4px 12px", md: "8px 16px", lg: "10px 20px" }[theme.btn_size] || "8px 16px";

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: theme.background, borderColor: theme.border_color }}>
      {/* Mini Navbar */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: theme.surface, borderBottom: `1px solid ${theme.border_color}` }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[8px] font-bold" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>آ</div>
          <span className="text-[10px] font-bold" style={{ color: theme.text_color }}>آفاق</span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px]" style={{ color: theme.text_muted }}>الرئيسية</span>
          <span className="text-[9px]" style={{ color: theme.text_muted }}>الأكاديمية</span>
          <span className="text-[9px]" style={{ color: theme.text_muted }}>تواصل</span>
        </div>
      </div>

      {/* Mini Hero */}
      <div className="px-4 py-5 text-center" style={{ background: `linear-gradient(135deg, ${theme.primary}08, ${theme.secondary}08)` }}>
        <div className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>آ</div>
        <div className="text-xs font-bold mb-1" style={{ color: theme.text_color }}>آفاق تكنولوجي</div>
        <div className="text-[9px] mb-2" style={{ color: theme.text_secondary }}>منصتك الرقمية المتكاملة</div>
        <div className="flex justify-center gap-1.5">
          <span className="text-white text-[8px] px-2.5 py-1 font-bold rounded-lg" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}>تواصل معنا</span>
          <span className="text-[8px] px-2.5 py-1 font-bold rounded-lg border" style={{ color: theme.primary, borderColor: theme.primary }}>اكتشف</span>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-3 gap-px" style={{ background: theme.border_color }}>
        {[["150+", "مشروع"], ["500+", "مستخدم"], ["8", "خدمات"]].map(([n, l], i) => (
          <div key={i} className="px-2 py-2 text-center" style={{ background: theme.surface }}>
            <div className="text-[10px] font-bold" style={{ color: theme.primary }}>{n}</div>
            <div className="text-[7px]" style={{ color: theme.text_muted }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Mini Cards */}
      <div className="grid grid-cols-2 gap-1.5 p-2.5" style={{ background: theme.surface_alt }}>
        {[{ icon: "🌐", title: "تصميم المواقع" }, { icon: "📱", title: "التواصل الاجتماعي" }, { icon: "📄", title: "صفحات الهبوط" }, { icon: "🎓", title: "المنصة التعليمية" }].map((s, i) => (
          <div key={i} className="p-2 rounded-lg" style={{ background: theme.surface, border: `1px solid ${theme.border_color}`, borderRadius: r }}>
            <div className="text-sm mb-0.5">{s.icon}</div>
            <div className="text-[8px] font-bold" style={{ color: theme.text_color }}>{s.title}</div>
          </div>
        ))}
      </div>

      {/* Mini Footer */}
      <div className="px-3 py-2 text-center" style={{ background: theme.surface, borderTop: `1px solid ${theme.border_color}` }}>
        <div className="text-[7px]" style={{ color: theme.text_muted }}>© 2025 آفاق تكنولوجي</div>
      </div>
    </div>
  );
}

export default function AdminThemesPage() {
  const t = useTranslations();
  const [themes, setThemes] = useState<ThemeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ThemeData | null>(null);
  const [form, setForm] = useState<Partial<ThemeData>>(EMPTY_THEME);
  const [previewTheme, setPreviewTheme] = useState<ThemeData | null>(null);
  const [activeTab, setActiveTab] = useState<"colors" | "buttons" | "cards" | "fonts">("colors");
  const [themeSelectedLang, setThemeSelectedLang] = useState("ar");
  const [themeNameInput, setThemeNameInput] = useState("");
  const [themeDescInput, setThemeDescInput] = useState("");

  useEffect(() => { fetchThemes(); }, []);

  const fetchThemes = async () => {
    try { const res = await api.get("/themes/admin/"); setThemes(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/themes/admin/${editing.id}/`, form);
      else await api.post("/themes/admin/create/", form);
      resetForm(); fetchThemes();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/themes/admin/${id}/delete/`); fetchThemes(); } catch {}
  };

  const handleActivate = async (th: ThemeData) => {
    try {
      await api.put(`/themes/admin/${th.id}/`, { ...th, is_active: true });
      fetchThemes();
    } catch {}
  };

  const handleSetDefault = async (th: ThemeData) => {
    try {
      await api.put(`/themes/admin/${th.id}/`, { ...th, is_default: true });
      fetchThemes();
    } catch {}
  };

  useEffect(() => {
    const tr = form.translations || {};
    setThemeNameInput(tr[themeSelectedLang]?.name || "");
    setThemeDescInput(tr[themeSelectedLang]?.description || "");
  }, [themeSelectedLang, form.translations]);

  const updateTranslation = (field: "name" | "description", val: string) => {
    const tr = { ...(form.translations || {}) };
    const entry = { ...(tr[themeSelectedLang] || { name: "", description: "" }) };
    entry[field] = val;
    tr[themeSelectedLang] = entry;
    setForm((p) => ({ ...p, translations: tr }));
    if (field === "name") setThemeNameInput(val);
    else setThemeDescInput(val);
  };

  const resetForm = () => { setForm(EMPTY_THEME); setEditing(null); setShowForm(false); setActiveTab("colors"); setThemeSelectedLang("ar"); setThemeNameInput(""); setThemeDescInput(""); };
  const startEdit = (th: ThemeData) => { setForm({ ...th }); setEditing(th); setShowForm(true); };
  const themeFilled = LANGUAGES.filter(l => form.translations?.[l.code]?.name?.trim()).length;
  const set = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

  const btnRadius = { rounded: "12px", pill: "9999px", square: "4px" }[form.btn_shape || "rounded"] || "12px";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.themes")}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{t("admin.themePreviewHint")}</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
            + {t("admin.newTheme")}
          </button>
        </div>

        {/* Main Content: Themes Grid + Preview */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Themes Grid */}
          <div className={`${showForm ? "lg:w-1/2" : "w-full"} transition-all`}>
            {isLoading ? (
              <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
            ) : themes.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed" style={{ borderColor: "var(--color-border)" }}>
                <p className="text-lg mb-2" style={{ color: "var(--color-text-muted)" }}>{t("admin.noThemes")}</p>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>{t("admin.noThemesHint")}</p>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 rounded-xl font-bold text-white" style={{ background: "var(--color-primary)" }}>+ {t("admin.createTheme")}</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {themes.map((th) => (
                  <div
                    key={th.id}
                    className={`rounded-3xl border-2 overflow-hidden transition-all cursor-pointer hover:-translate-y-1 ${
                      previewTheme?.id === th.id ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{
                      borderColor: previewTheme?.id === th.id ? th.primary : "var(--color-border)",
                      background: "var(--color-surface)",
                      boxShadow: "var(--card-shadow)",
                    }}
                    onClick={() => setPreviewTheme(th)}
                  >
                    {/* Theme Header with Gradient */}
                    <div className="h-24 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${th.primary}, ${th.secondary})` }}>
                      <span className="text-4xl drop-shadow-lg">{th.icon}</span>
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {th.is_default && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/90" style={{ color: th.primary }}>{t("admin.default")}</span>}
                        {th.is_active && <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/90 text-green-600">{t("admin.active")}</span>}
                      </div>
                    </div>

                    {/* Theme Info */}
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{th.translations?.ar?.name || th.display_name}</h3>
                        {th.translations?.en?.name && <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{th.translations.en.name}</p>}
                      </div>

                      {th.translations?.ar?.description && <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{th.translations.ar.description}</p>}
                      {th.translations?.en?.description && <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>{th.translations.en.description}</p>}
                      {!th.translations?.ar?.description && !th.translations?.en?.description && <div className="mb-3" />}

                      {/* Color Palette */}
                      <div className="flex gap-1.5 mb-3">
                        <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: th.primary }} title={t("admin.colorPrimary")} />
                        <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: th.secondary }} title={t("admin.colorSecondary")} />
                        <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: th.accent }} title={t("admin.colorAccent")} />
                        <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: th.background }} title={t("admin.colorBackground")} />
                        <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: th.text_color }} title={t("admin.colorText")} />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(th); }}
                          className="flex-1 px-3 py-2 text-sm font-medium rounded-xl transition-all"
                          style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}
                        >
                          {t("common.edit")}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleActivate(th); }}
                          className="px-3 py-2 text-sm font-medium rounded-xl transition-all"
                          style={{ backgroundColor: th.is_active ? "var(--color-success-light)" : "var(--color-surface-alt)", color: th.is_active ? "var(--color-success)" : "var(--color-text-muted)" }}
                          title={th.is_active ? t("admin.active") : t("admin.activateTheme")}
                        >
                          {th.is_active ? "✓" : "○"}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSetDefault(th); }}
                          className="px-3 py-2 text-sm font-medium rounded-xl transition-all"
                          style={{ backgroundColor: th.is_default ? "var(--color-primary-light)" : "var(--color-surface-alt)", color: th.is_default ? "var(--color-primary)" : "var(--color-text-muted)" }}
                          title={th.is_default ? t("admin.default") : t("admin.setDefault")}
                        >
                          ★
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(th.id); }}
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

          {/* Right: Live Preview Panel */}
          {previewTheme && !showForm && (
            <div className="hidden lg:block w-[480px] flex-shrink-0">
              <div className="sticky top-8">
                <div className="rounded-3xl border overflow-hidden" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", boxShadow: "var(--card-shadow)" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{t("admin.livePreview")}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{previewTheme.icon} {previewTheme.translations?.ar?.name || previewTheme.display_name} {previewTheme.translations?.en?.name && `/ ${previewTheme.translations.en.name}`}</span>
                  </div>
                  <div className="p-4 max-h-[70vh] overflow-y-auto">
                    <ThemeMiniPreview theme={previewTheme} />
                  </div>
                  <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "var(--color-border)" }}>
                    <button onClick={() => startEdit(previewTheme)} className="flex-1 px-3 py-2 text-sm font-medium rounded-xl" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{t("common.edit")}</button>
                    <button onClick={() => handleActivate(previewTheme)} className="flex-1 px-3 py-2 text-sm font-medium rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.secondary})` }}>{t("admin.activate")}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col lg:flex-row" style={{ background: "var(--color-surface)" }}>
              {/* Left: Form */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                    {editing ? t("admin.editTheme") : t("admin.newTheme")}
                  </h2>
                  <button onClick={resetForm} className="text-xl" style={{ color: "var(--color-text-muted)" }}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Basic Info */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.icon")}</label>
                      <input type="text" value={form.icon || ""} onChange={(e) => set("icon", e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }} />
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
                        <select value={themeSelectedLang} onChange={(e) => setThemeSelectedLang(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }}>
                          {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code}>{l.label} {form.translations?.[l.code]?.name?.trim() ? "✅" : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>الاسم ({LANGUAGES.find(l => l.code === themeSelectedLang)?.label})</label>
                        <input type="text" value={themeNameInput} onChange={(e) => updateTranslation("name", e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }}
                          dir={themeSelectedLang === "ar" || themeSelectedLang === "ur" ? "rtl" : "ltr"} />
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {LANGUAGES.map(l => (
                        <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${form.translations?.[l.code]?.name?.trim() ? "" : "opacity-40"}`}
                          style={{ background: themeSelectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: themeSelectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                          onClick={() => setThemeSelectedLang(l.code)}>{l.code} {form.translations?.[l.code]?.name?.trim() ? "✓" : ""}</span>
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>الاسم: {themeFilled}/{LANGUAGES.length}</p>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>الوصف ({LANGUAGES.find(l => l.code === themeSelectedLang)?.label})</label>
                      <input type="text" value={themeDescInput} onChange={(e) => updateTranslation("description", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }}
                        dir={themeSelectedLang === "ar" || themeSelectedLang === "ur" ? "rtl" : "ltr"} />
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ backgroundColor: "var(--color-muted)" }}>
                    {([["colors", `🎨 ${t("admin.tabColors")}`], ["buttons", `🔘 ${t("admin.tabButtons")}`], ["cards", `🃏 ${t("admin.tabCards")}`], ["fonts", `📝 ${t("admin.tabFonts")}`]] as const).map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setActiveTab(key)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: activeTab === key ? "var(--color-surface)" : "transparent",
                          color: activeTab === key ? "var(--color-primary)" : "var(--color-text-muted)",
                          boxShadow: activeTab === key ? "var(--btn-shadow)" : "none",
                        }}
                      >{label}</button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-2.5 p-4 rounded-2xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-alt)" }}>
                    {activeTab === "colors" && (
                      <>
                        {([["primary", t("admin.colorPrimary")], ["secondary", t("admin.colorSecondary")], ["accent", t("admin.colorAccent")], ["success", t("admin.colorSuccess")], ["error", t("admin.colorError")], ["warning", t("admin.colorWarning")], ["background", t("admin.colorBackground")], ["surface", t("admin.colorSurface")], ["surface_alt", t("admin.colorSurfaceAlt")], ["text_color", t("admin.colorText")], ["text_secondary", t("admin.colorTextSec")], ["text_muted", t("admin.colorTextMuted")], ["border_color", t("admin.colorBorder")]] as const).map(([field, label]) => (
                          <div key={field} className="flex items-center gap-3">
                            <label className="text-xs font-medium w-24 shrink-0" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
                            <input type="color" value={(form as any)[field] || "#000000"} onChange={(e) => set(field, e.target.value)} className="w-8 h-8 rounded-lg border-2 cursor-pointer border-[var(--color-border)]" />
                            <input type="text" value={(form as any)[field] || ""} onChange={(e) => set(field, e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }} />
                          </div>
                        ))}
                      </>
                    )}
                    {activeTab === "buttons" && (
                      <>
                        {([["btn_shape", t("admin.btnShape"), [["rounded", "Rounded"], ["pill", "Pill"], ["square", "Square"]]], ["btn_size", t("admin.btnSize"), [["sm", "S"], ["md", "M"], ["lg", "L"]]], ["btn_shadow", t("admin.btnShadow"), [["none", "—"], ["sm", "S"], ["md", "M"], ["lg", "L"]]], ["btn_hover", t("admin.btnHover"), [["none", "—"], ["scale", "Scale"], ["shadow", "Shadow"], ["glow", "Glow"]]]] as const).map(([field, label, options]) => (
                          <div key={field} className="flex items-center gap-3">
                            <label className="text-xs font-medium w-24 shrink-0" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
                            <div className="flex gap-1 flex-1">
                              {options.map(([val, lbl]) => (
                                <button key={val} type="button" onClick={() => set(field, val)}
                                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all"
                                  style={{
                                    background: (form as any)[field] === val ? "var(--color-primary)" : "var(--color-surface)",
                                    color: (form as any)[field] === val ? "white" : "var(--color-text)",
                                    borderColor: (form as any)[field] === val ? "var(--color-primary)" : "var(--color-border)",
                                  }}
                                >{lbl}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {activeTab === "cards" && (
                      <>
                        {([["card_radius", t("admin.cardRadius"), [["none", "—"], ["sm", "S"], ["md", "M"], ["lg", "L"], ["full", "Full"]]], ["card_shadow", t("admin.cardShadow"), [["none", "—"], ["sm", "S"], ["md", "M"], ["lg", "L"]]]] as const).map(([field, label, options]) => (
                          <div key={field} className="flex items-center gap-3">
                            <label className="text-xs font-medium w-24 shrink-0" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
                            <div className="flex gap-1 flex-1">
                              {options.map(([val, lbl]) => (
                                <button key={val} type="button" onClick={() => set(field, val)}
                                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all"
                                  style={{
                                    background: (form as any)[field] === val ? "var(--color-primary)" : "var(--color-surface)",
                                    color: (form as any)[field] === val ? "white" : "var(--color-text)",
                                    borderColor: (form as any)[field] === val ? "var(--color-primary)" : "var(--color-border)",
                                  }}
                                >{lbl}</button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3">
                          <label className="text-xs font-medium w-24 shrink-0" style={{ color: "var(--color-text-secondary)" }}>{t("admin.cardGlass")}</label>
                          <button type="button" onClick={() => set("card_glass", !form.card_glass)}
                            className="w-12 h-6 rounded-full transition-all relative"
                            style={{ background: form.card_glass ? "var(--color-primary)" : "var(--color-surface-alt)" }}
                          >
                            <div className="w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all" style={{ left: form.card_glass ? "26px" : "2px" }} />
                          </button>
                        </div>
                      </>
                    )}
                    {activeTab === "fonts" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fontHeading")}</label>
                          <input type="text" value={form.font_heading || ""} onChange={(e) => set("font_heading", e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm font-mono" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fontBody")}</label>
                          <input type="text" value={form.font_body || ""} onChange={(e) => set("font_body", e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm font-mono" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.fontSize")}</label>
                          <input type="text" value={form.font_size || ""} onChange={(e) => set("font_size", e.target.value)} className="w-full px-3 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-surface)" }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-5">
                    <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                      {editing ? t("admin.saveChanges") : t("admin.createTheme")}
                    </button>
                    <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-secondary)" }}>
                      {t("admin.cancel")}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right: Live Preview */}
              <div className="hidden lg:block w-[400px] border-l overflow-y-auto p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <p className="text-xs font-bold mb-3" style={{ color: "var(--color-text-muted)" }}>{t("admin.livePreview")}</p>
                <ThemeMiniPreview theme={form as ThemeData} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

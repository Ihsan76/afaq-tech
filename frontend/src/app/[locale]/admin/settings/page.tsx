"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";

export default function AdminSettingsPage() {
  const t = useTranslations();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name }));
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [lang, setLang] = useState("ar");
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [footerInput, setFooterInput] = useState("");

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    if (!settings) return;
    setNameInput(settings.translations?.[lang]?.site_name || "");
    setDescInput(settings.translations?.[lang]?.site_description || "");
    setFooterInput(settings.footer_translations?.[lang]?.footer_text || "");
  }, [lang, settings]);

  const fetchSettings = async () => {
    try { const res = await api.get("/pages/settings/"); setSettings(res.data); } catch {} finally { setIsLoading(false); }
  };

  const updateTranslation = (field: "site_name" | "site_description" | "footer_text", val: string) => {
    if (field === "footer_text") {
      const ft = { ...(settings.footer_translations || {}) };
      ft[lang] = { ...(ft[lang] || {}), footer_text: val };
      setSettings({ ...settings, footer_translations: ft });
      setFooterInput(val);
    } else {
      const tr = { ...(settings.translations || {}) };
      tr[lang] = { ...(tr[lang] || {}), [field]: val };
      setSettings({ ...settings, translations: tr });
      if (field === "site_name") setNameInput(val);
      else setDescInput(val);
    }
  };

  const handleSave = async () => {
    try {
      const payload: any = { ...settings };
      delete payload.site_name;
      delete payload.site_description;
      delete payload.footer_text;
      await api.put("/pages/admin/settings/", payload);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const sectionStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)" };

  const nameFilled = LANGUAGES.filter(l => settings?.translations?.[l.code]?.site_name?.trim()).length;
  const descFilled = LANGUAGES.filter(l => settings?.translations?.[l.code]?.site_description?.trim()).length;
  const footerFilled = LANGUAGES.filter(l => settings?.footer_translations?.[l.code]?.footer_text?.trim()).length;

  const langBadges = (trGetter: (code: string) => string | undefined) => (
    <div className="flex gap-2 flex-wrap mb-2">
      {LANGUAGES.map(l => (
        <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${trGetter(l.code) ? "" : "opacity-40"}`}
          style={{ background: lang === l.code ? "var(--color-primary)" : "var(--color-background)", color: lang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
          onClick={() => setLang(l.code)}>{l.code} {trGetter(l.code) ? "✓" : ""}</span>
      ))}
    </div>
  );

  if (isLoading) return <div className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>;
  if (!settings) return <div className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>{t("common.error")}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.settings")}</h1>
        <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-md transition-all" style={{ background: saved ? "var(--color-success)" : "var(--btn-primary-bg)" }}>
          {saved ? `${t("admin.saved")} ✓` : t("common.save")}
        </button>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.basicInfo")}</h2>
          <div className="flex gap-3 items-end mb-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls} style={style}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label} {settings.translations?.[l.code]?.site_name?.trim() ? "✅" : ""}</option>
                ))}
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.siteName")} ({LANGUAGES.find(l => l.code === lang)?.label})</label>
              <input type="text" value={nameInput} onChange={(e) => updateTranslation("site_name", e.target.value)}
                className={inputCls} style={style} dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"} />
            </div>
          </div>
          {langBadges((code) => settings.translations?.[code]?.site_name)}
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>اسم الموقع: {nameFilled}/{LANGUAGES.length}</p>

          <div className="mb-2">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.siteDesc")} ({LANGUAGES.find(l => l.code === lang)?.label})</label>
            <textarea value={descInput} onChange={(e) => updateTranslation("site_description", e.target.value)}
              className={inputCls + " resize-none"} style={style} rows={2} dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"} />
          </div>
          {langBadges((code) => settings.translations?.[code]?.site_description)}
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>الوصف: {descFilled}/{LANGUAGES.length}</p>
        </div>

        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.contactInfo")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.email")}</label>
              <input value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className={inputCls} style={style} type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.phone")}</label>
              <input value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.whatsapp")}</label>
              <input value={settings.whatsapp || ""} onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.address")}</label>
              <input value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className={inputCls} style={style} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.socialMedia")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { field: "facebook_url", label: "Facebook" },
              { field: "twitter_url", label: "Twitter / X" },
              { field: "instagram_url", label: "Instagram" },
              { field: "linkedin_url", label: "LinkedIn" },
              { field: "youtube_url", label: "YouTube" },
            ].map((s) => (
              <div key={s.field}>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{s.label}</label>
                <input value={settings[s.field] || ""} onChange={(e) => setSettings({ ...settings, [s.field]: e.target.value })} className={inputCls} style={style} placeholder="https://" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.footerText")}</h2>
          <div className="flex gap-3 items-end mb-2">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className={inputCls} style={style}>
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label} {settings.footer_translations?.[l.code]?.footer_text?.trim() ? "✅" : ""}</option>
                ))}
              </select>
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.footerText")} ({LANGUAGES.find(l => l.code === lang)?.label})</label>
              <textarea value={footerInput} onChange={(e) => updateTranslation("footer_text", e.target.value)}
                className={inputCls + " resize-none"} style={style} rows={2} dir={lang === "ar" || lang === "ur" ? "rtl" : "ltr"} />
            </div>
          </div>
          {langBadges((code) => settings.footer_translations?.[code]?.footer_text)}
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>نص التذييل: {footerFilled}/{LANGUAGES.length}</p>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.copyright")}</label>
            <input value={settings.copyright_text || ""} onChange={(e) => setSettings({ ...settings, copyright_text: e.target.value })} className={inputCls} style={style} />
          </div>
        </div>
      </div>
    </div>
  );
}

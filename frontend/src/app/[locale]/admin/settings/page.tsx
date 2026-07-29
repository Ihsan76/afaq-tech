"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

export default function AdminSettingsPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try { const res = await api.get("/pages/settings/"); setSettings(res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleSave = async () => {
    try {
      await api.put("/pages/admin/settings/", settings);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const update = (field: string, value: string) => setSettings({ ...settings, [field]: value });

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const sectionStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)" };

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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.nameEn")}</label>
              <input value={settings.site_name_en || ""} onChange={(e) => update("site_name_en", e.target.value)} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.nameAr")}</label>
              <input value={settings.site_name_ar || ""} onChange={(e) => update("site_name_ar", e.target.value)} className={inputCls} style={style} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.siteDesc")} (English)</label>
              <textarea value={settings.site_description_en || ""} onChange={(e) => update("site_description_en", e.target.value)} className={inputCls + " resize-none"} style={style} rows={2} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.siteDesc")} (Arabic)</label>
              <textarea value={settings.site_description_ar || ""} onChange={(e) => update("site_description_ar", e.target.value)} className={inputCls + " resize-none"} style={style} rows={2} />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.contactInfo")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.email")}</label>
              <input value={settings.email || ""} onChange={(e) => update("email", e.target.value)} className={inputCls} style={style} type="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.phone")}</label>
              <input value={settings.phone || ""} onChange={(e) => update("phone", e.target.value)} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.whatsapp")}</label>
              <input value={settings.whatsapp || ""} onChange={(e) => update("whatsapp", e.target.value)} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.address")}</label>
              <input value={settings.address || ""} onChange={(e) => update("address", e.target.value)} className={inputCls} style={style} />
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
                <input value={settings[s.field] || ""} onChange={(e) => update(s.field, e.target.value)} className={inputCls} style={style} placeholder="https://" />
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl border" style={{ ...sectionStyle, boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>{t("admin.footerText")}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.footerText")} (English)</label>
              <textarea value={settings.footer_text_en || ""} onChange={(e) => update("footer_text_en", e.target.value)} className={inputCls + " resize-none"} style={style} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.footerText")} (Arabic)</label>
              <textarea value={settings.footer_text_ar || ""} onChange={(e) => update("footer_text_ar", e.target.value)} className={inputCls + " resize-none"} style={style} rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.copyright")}</label>
              <input value={settings.copyright_text || ""} onChange={(e) => update("copyright_text", e.target.value)} className={inputCls} style={style} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

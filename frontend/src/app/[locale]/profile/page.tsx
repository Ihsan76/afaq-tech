"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface UserRoleEntry {
  id: number;
  role: string;
  icon: string;
  label_ar: string;
  label_en: string;
  context_url: string;
  organization: string | null;
  assigned_at: string;
}

export default function ProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user, isLoading, loadUser } = useAuthStore();
  const loadedRef = useRef(false);

  useEffect(() => { if (!loadedRef.current) { loadedRef.current = true; loadUser(); } }, [loadUser]);
  useEffect(() => { if (loadedRef.current && !isLoading && !user) router.push(`/${locale}/login`); }, [user, isLoading, router, locale]);

  const [form, setForm] = useState({
    name_ar: "",
    name_en: "",
    email: "",
    phone: "",
    timezone: "",
    ui_language: "ar",
    input_language: "ar",
    output_language: "ar",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [roles, setRoles] = useState<UserRoleEntry[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const handleExportData = async () => {
    try {
      const res = await api.post("/core/data-export/");
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `afaq_user_data_${user?.id || 'export'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMessage(t("profile.exportSuccess"));
    } catch {
      setMessage(t("profile.saveError"));
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t("profile.deleteConfirm"))) return;
    try {
      await api.post("/core/deletion-request/");
      setMessage(t("profile.deleteRequested"));
      setTimeout(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push(`/${locale}/login`);
      }, 3000);
    } catch {
      setMessage(t("profile.saveError"));
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name_ar: user.name_ar || "",
        name_en: user.name_en || "",
        email: user.email || "",
        phone: user.phone || "",
        timezone: user.timezone || "Asia/Amman",
        ui_language: user.ui_language || "ar",
        input_language: user.input_language || "ar",
        output_language: user.output_language || "ar",
      });
      api.get("/auth/my-roles/")
        .then((res) => setRoles(res.data.roles || []))
        .catch(() => setRoles([]))
        .finally(() => setRolesLoading(false));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.patch("/auth/profile/", form);
      setMessage(t("profile.saveSuccess"));
      await loadUser();
    } catch {
      setMessage(t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span className="text-lg">{t("common.loading")}</span>
      </div>
    </div>
  );

  if (!user) return null;

  const inputCls = "w-full px-4 py-2.5 rounded-xl border bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "0 4px 15px var(--color-primary)" }}>
              {(user.name_ar || user.email)?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.title")}</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{user.email}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            message.includes("خطأ") || message.includes("error")
              ? "bg-[var(--color-error-light)] text-[var(--color-error)] border border-[var(--color-error)]"
              : "bg-[var(--color-success-light)] text-[var(--color-success)] border border-[var(--color-success)]"
          }`}>{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.personalInfo")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.nameAr")}</label>
                <input type="text" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.nameEn")}</label>
                <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.email")}</label>
                <input type="email" value={form.email} disabled className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-muted)] cursor-not-allowed" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.phone")}</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.timezone")}</label>
                <SelectDropdown value={form.timezone} onChange={(v) => setForm({ ...form, timezone: String(v) })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="Asia/Amman">Asia/Amman (GMT+3)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                </SelectDropdown>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.languageSettings")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.uiLanguage")}</label>
                <SelectDropdown value={form.ui_language} onChange={(v) => setForm({ ...form, ui_language: String(v) })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </SelectDropdown>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.inputLanguage")}</label>
                <SelectDropdown value={form.input_language} onChange={(v) => setForm({ ...form, input_language: String(v) })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </SelectDropdown>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.outputLanguage")}</label>
                <SelectDropdown value={form.output_language} onChange={(v) => setForm({ ...form, output_language: String(v) })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </SelectDropdown>
              </div>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
                <span className="text-xl">🎨</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.appearance")}</h2>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("profile.appearanceDesc")}</p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>

          {/* Account Info */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{t("profile.role")}: {user.role}</span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                user.is_verified ? "bg-[var(--color-success-light)] text-[var(--color-success)]" : "bg-[var(--color-muted)] text-[var(--color-text-muted)]"
              }`}>
                {user.is_verified ? t("profile.verified") : t("profile.notVerified")}
              </span>
              {!user.is_verified && (
                <button
                  onClick={() => router.push(`/${locale}/verify-email?email=${encodeURIComponent(user.email)}`)}
                  className="text-xs font-semibold underline ml-1"
                  style={{ color: "var(--color-primary)" }}
                >
                  {t("auth.verify")}
                </button>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("profile.memberSince")}: {new Date(user.date_joined).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}</p>
          </div>

          {/* Roles Dashboard */}
          {roles.length > 0 && (
            <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
                  <span className="text-xl">🎭</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                    {locale === "ar" ? "أدوارك النشطة" : "Your Active Roles"}
                  </h2>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {locale === "ar" ? `${roles.length} ${roles.length === 1 ? "دور" : "أدوار"}` : `${roles.length} role${roles.length === 1 ? "" : "s"}`}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {roles.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/${locale}${entry.context_url}`}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                  >
                    <span className="text-2xl">{entry.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {locale === "ar" ? entry.label_ar : entry.label_en}
                      </p>
                      {entry.organization && (
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {entry.organization}
                        </p>
                      )}
                    </div>
                    <svg className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Data Management */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.privacyData")}</h2>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("profile.deleteAccountDesc")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", background: "var(--color-background)" }}
              >
                📥 {t("profile.exportData")}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "rgba(239, 68, 68, 0.15)", color: "var(--color-error)" }}
              >
                ⚠️ {t("profile.deleteAccount")}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
              boxShadow: "var(--btn-shadow)",
              transform: "var(--btn-hover-transform)",
            }}
          >
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </form>
      </div>
    </div>
  );
}

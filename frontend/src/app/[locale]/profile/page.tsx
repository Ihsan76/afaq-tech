"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import ThemeSwitcher from "@/components/ThemeSwitcher";

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
                <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="Asia/Amman">Asia/Amman (GMT+3)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                  <option value="Africa/Cairo">Africa/Cairo (GMT+2)</option>
                  <option value="Europe/London">Europe/London (GMT+0)</option>
                  <option value="America/New_York">America/New_York (GMT-5)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Language Settings */}
          <div className="glass-strong p-6 rounded-3xl border" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("profile.languageSettings")}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.uiLanguage")}</label>
                <select value={form.ui_language} onChange={(e) => setForm({ ...form, ui_language: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.inputLanguage")}</label>
                <select value={form.input_language} onChange={(e) => setForm({ ...form, input_language: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("profile.outputLanguage")}</label>
                <select value={form.output_language} onChange={(e) => setForm({ ...form, output_language: e.target.value })} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                  <option value="tr">Türkçe</option>
                </select>
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

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    try { await login(email, password); router.push(`/${locale}/dashboard`); }
    catch (err: any) { setLocalError(err?.response?.data?.error || err?.message || t("loginError")); }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("welcome")}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t("login")}</p>
        </div>

        <div className="glass-strong rounded-3xl p-5 sm:p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {displayError && (
            <div className="px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              <span>⚠</span> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
                placeholder="name@example.com" required />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
                placeholder="••••••••" required />
              <div className="text-right mt-2.5">
                <Link href={`/${locale}/forgot-password`} className="text-sm font-medium transition-colors" style={{ color: "var(--color-primary)" }}>
                  {t("forgotPassword")}
                </Link>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {t("login")}...
                </span>
              ) : t("login")}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("register")}{" "}
              <Link href={`/${locale}/register`} className="font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>
                {t("register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

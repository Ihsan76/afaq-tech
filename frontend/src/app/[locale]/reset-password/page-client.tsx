"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const token = searchParams.get("token");
  const uid = searchParams.get("uid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    if (password !== confirmPassword) { setError(t("confirmPassword") + " ≠"); setIsLoading(false); return; }
    try { await api.post("/auth/reset-password/", { uid, token, password }); setSuccess(true); }
    catch { setError(t("invalidToken")); } finally { setIsLoading(false); }
  };

  if (!token || !uid) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md glass-strong rounded-3xl p-8 border text-center" style={{ borderColor: "var(--color-border)" }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-error-light)" }}><span className="text-3xl">❌</span></div>
        <p className="font-medium mb-6" style={{ color: "var(--color-error)" }}>{t("tokenMissing")}</p>
        <Link href={`/${locale}/forgot-password`} className="font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>{t("forgotPassword")}</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("resetPassword")}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t("enterNewPassword")}</p>
        </div>
        <div className="glass-strong rounded-3xl p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-success-light)" }}><span className="text-3xl">✅</span></div>
              <p className="font-medium mb-6" style={{ color: "var(--color-success)" }}>{t("resetSuccess")}</p>
              <Link href={`/${locale}/login`} className="font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>{t("login")}</Link>
            </div>
          ) : (
            <>
              {error && <div className="px-4 py-3 rounded-2xl mb-6 text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>⚠ {error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("password")}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="••••••••" required minLength={8} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("confirmPassword")}</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="••••••••" required />
                </div>
                <button type="submit" disabled={isLoading} className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
                  {isLoading ? "..." : t("resetPassword")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

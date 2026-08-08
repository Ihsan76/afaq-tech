"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError("");
    try { await api.post("/auth/forgot-password/", { email, locale }); setSuccess(true); }
    catch { setSuccess(true); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("forgotPassword")}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t("enterEmailReset")}</p>
        </div>
        <div className="glass-strong rounded-3xl p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-success-light)" }}><span className="text-3xl">✅</span></div>
              <p className="font-medium mb-6" style={{ color: "var(--color-success)" }}>{t("resetLinkSent")}</p>
              <Link href={`/${locale}/login`} className="font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>{t("login")}</Link>
            </div>
          ) : (
            <>
              {error && <div className="px-4 py-3 rounded-2xl mb-6 text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>⚠ {error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("email")}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="name@example.com" required />
                </div>
                <button type="submit" disabled={isLoading} className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
                  {isLoading ? "..." : t("resetPassword")}
                </button>
              </form>
              <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
                <Link href={`/${locale}/login`} className="text-sm font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>{t("login")}</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

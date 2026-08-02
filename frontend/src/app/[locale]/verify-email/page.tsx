"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const initialEmail = searchParams.get("email") || "";
  const { user, confirmVerification, sendVerification } = useAuthStore();

  const [email, setEmail] = useState(initialEmail || user?.email || "");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await confirmVerification(email, code);
      setMessage(t("verificationSuccess"));
      setTimeout(() => router.push(`/${locale}/dashboard`), 1200);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error;
      setError(errMsg === "Code expired or already used" ? t("codeExpired") : errMsg === "Invalid code" ? t("codeInvalid") : t("codeInvalid"));
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setMessage("");
    try {
      await sendVerification(email, locale);
      setMessage(t("verificationCodeSent"));
    } catch {
      setError(t("loginError"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("verifyYourEmail")}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{t("verificationCodeSent")}</p>
        </div>

        <div className="glass-strong rounded-3xl p-5 sm:p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {error && (
            <div className="px-4 py-3 rounded-2xl mb-6 text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              {error}
            </div>
          )}
          {message && (
            <div className="px-4 py-3 rounded-2xl mb-6 text-sm" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" }}>
              {message}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("enterVerificationCode")}</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all tracking-widest text-center"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
                maxLength={6} required />
            </div>

            <button type="submit"
              className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all duration-200"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
              {t("verify")}
            </button>
          </form>

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
            <button type="button" onClick={handleResend} disabled={resending} className="text-sm font-medium transition-colors disabled:opacity-50" style={{ color: "var(--color-primary)" }}>
              {resending ? "..." : t("resendCode")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

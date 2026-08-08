"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import GoogleButton from "@/components/GoogleButton";
import { extractApiError, apiErrorKey } from "@/lib/apiErrors";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { register, isLoading, error } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (password !== confirmPassword) { setLocalError(t("confirmPassword") + " ≠"); return; }
    try { await register(email, name, password); router.push(`/${locale}/verify-email?email=${encodeURIComponent(email)}`); } catch (err: any) {
      const errMsg = extractApiError(err);
      const key = apiErrorKey(errMsg);
      setLocalError(key ? te(key) : errMsg || t("loginError"));
    }
  };

  const displayError = localError || error;
  const inputCls = "w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("register")}</h1>
          <p style={{ color: "var(--color-text-muted)" }}>{tc("appName")}</p>
        </div>

        <div className="glass-strong rounded-3xl p-5 sm:p-8 border" style={{ borderColor: "var(--color-border)" }}>
          {displayError && (
            <div className="px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              <span>⚠</span> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("name")}</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("email")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="name@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 ps-4 pe-12 border rounded-2xl focus:ring-2 transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="••••••••" required minLength={8} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 px-4 flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("confirmPassword")}</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3.5 ps-4 pe-12 border rounded-2xl focus:ring-2 transition-all" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }} placeholder="••••••••" required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 end-0 px-4 flex items-center text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
              {isLoading ? "..." : t("register")}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("or")}</span>
            <div className="flex-1" style={{ borderTop: "1px solid var(--color-border)" }} />
          </div>

          <GoogleButton />

          <div className="mt-6 pt-6 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {t("login")}{" "}
              <Link href={`/${locale}/login`} className="font-semibold transition-colors" style={{ color: "var(--color-primary)" }}>
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

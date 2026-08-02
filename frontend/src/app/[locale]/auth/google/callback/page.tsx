"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/auth";

export default function GoogleCallbackPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1] || "en";
  const { completeGoogleLogin } = useAuthStore();
  const [error, setError] = useState("");
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const access = searchParams.get("access");
    const refresh = searchParams.get("refresh");
    const oauthError = searchParams.get("error");

    const run = async () => {
      if (oauthError) {
        setError(t("googleNotConfigured"));
        return;
      }
      if (!access || !refresh) {
        setError(t("loginError"));
        return;
      }
      try {
        await completeGoogleLogin(access, refresh);
        router.replace(`/${locale}/dashboard`);
      } catch {
        setError(t("loginError"));
      }
    };
    run();
  }, [searchParams, completeGoogleLogin, router, locale, t]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md text-center">
        {error ? (
          <div className="glass-strong rounded-3xl p-8 border" style={{ borderColor: "var(--color-border)" }}>
            <p style={{ color: "var(--color-error)" }}>{error}</p>
            <button
              onClick={() => router.push(`/${locale}/login`)}
              className="mt-6 text-white px-6 py-3 rounded-2xl font-semibold"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              {t("login")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24" style={{ color: "var(--color-primary)" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p style={{ color: "var(--color-text-muted)" }}>{t("login")}...</p>
          </div>
        )}
      </div>
    </div>
  );
}

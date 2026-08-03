"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface InviteInfo {
  org_name: string;
  email: string;
  role: string;
}

export default function JoinOrganizationPage() {
  const t = useTranslations("organization");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "ar";
  const user = useAuthStore((s) => s.user);

  const token = searchParams.get("token") || "";
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setLoading(false);
      return;
    }
    api.get(`/subscriptions/organizations/invites/${token}/`)
      .then((r) => setInvite(r.data))
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const emailMatches = !!invite && !!user && user.email.toLowerCase() === invite.email.toLowerCase();

  const accept = useCallback(async () => {
    if (!token || accepting) return;
    setAccepting(true);
    setMessage("");
    try {
      await api.post(`/subscriptions/organizations/invites/${token}/accept/`);
      setDone(true);
      setMessage(t("acceptSuccess"));
    } catch (err: any) {
      const error = err?.response?.data?.error;
      if (error === "already_in_organization") setMessage(t("alreadyMember"));
      else if (error === "email_mismatch") setMessage(t("emailMismatch"));
      else setMessage(t("inviteInvalid"));
    } finally {
      setAccepting(false);
    }
  }, [token, accepting, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <svg className="animate-spin h-6 w-6" style={{ color: "var(--color-text-muted)" }} viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>
    );
  }

  if (invalid || !invite) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
        <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="text-5xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("inviteInvalid")}</h1>
          <button onClick={() => router.push(`/${locale}`)} className="px-6 py-3 rounded-2xl font-semibold text-white transition-all"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            {t("backToSubscriptions")}
          </button>
        </div>
      </div>
    );
  }

  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-3xl shadow-xl border p-8 text-center" style={surfaceStyle}>
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("joinTitle")}</h1>
          <p className="mb-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t("joinTo")} <b style={{ color: "var(--color-text)" }}>{invite.org_name}</b>
          </p>
          <p className="mb-6 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t("joinAs")} <b style={{ color: "var(--color-text)" }}>{invite.role === "manager" ? t("roleManager") : t("roleTeacher")}</b>
          </p>

          {done ? (
            <p className="mb-6 px-4 py-3 rounded-2xl text-sm font-medium text-white" style={{ background: "var(--color-success)" }}>✅ {message}</p>
          ) : (
            <>
              {message && (
                <p className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium text-white" style={{ background: "var(--color-error)" }}>⚠️ {message}</p>
              )}

              {!user && (
                <>
                  <p className="mb-5 text-sm" style={{ color: "var(--color-text-secondary)" }}>{t("joinLoginRequired")}</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => router.push(`/${locale}/login`)} className="py-3 rounded-2xl font-semibold text-white transition-all"
                      style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
                      {t("loginBtn")}
                    </button>
                    <button onClick={() => router.push(`/${locale}/register`)} className="py-3 rounded-2xl font-semibold transition-all"
                      style={{ border: "2px solid var(--color-primary)", color: "var(--color-primary)", backgroundColor: "transparent" }}>
                      {t("registerBtn")}
                    </button>
                  </div>
                </>
              )}

              {user && !emailMatches && (
                <>
                  <p className="mb-5 text-sm" style={{ color: "var(--color-error)" }}>{t("emailMismatch")}</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => router.push(`/${locale}/login`)} className="py-3 rounded-2xl font-semibold text-white transition-all"
                      style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
                      {t("switchAccount")}
                    </button>
                  </div>
                </>
              )}

              {user && emailMatches && (
                <button onClick={accept} disabled={accepting} className="w-full py-3 rounded-2xl font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--btn-shadow)" }}>
                  {accepting ? "..." : t("acceptInvite")}
                </button>
              )}
            </>
          )}

          {done && (
            <button onClick={() => router.push(`/${locale}/organization`)} className="mt-4 py-3 rounded-2xl font-semibold text-white transition-all w-full"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
              {t("goToOrg")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

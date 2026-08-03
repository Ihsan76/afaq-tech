"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface Member {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  invite_token: string | null;
  invited_at: string | null;
  joined_at: string | null;
  is_owner: boolean;
}

interface OrgInfo {
  id: number;
  name: string;
  plan_code: string;
  plan_name: string;
  plan_seats: number;
  extra_seats: number;
  total_seats: number;
  occupied_seats: number;
  status: string;
  members: Member[];
  usage: {
    code: string;
    name: Record<string, string>;
    period: string;
    limit: number | null;
    used: number;
  }[];
}

export default function OrganizationPage() {
  const t = useTranslations("organization");
  const ts = useTranslations("subscriptions");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1] || "ar";
  const accessToken = useAuthStore((s) => s.accessToken);

  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [orgName, setOrgName] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [extraCount, setExtraCount] = useState(1);
  const [buyingSeats, setBuyingSeats] = useState(false);

  const surfaceCls = "rounded-3xl shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };
  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

  const fetchOrg = useCallback(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    api.get("/subscriptions/organizations/my/")
      .then((r) => {
        setOrg(r.data);
        setOrgName(r.data.name || "");
        setUnavailable(false);
      })
      .catch((err) => {
        if (err?.response?.status === 403) setUnavailable(true);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const saveName = async () => {
    if (!orgName.trim() || !org) return;
    try {
      const res = await api.patch("/subscriptions/organizations/my/", { name: orgName.trim() });
      setOrg((prev) => (prev ? { ...prev, name: res.data.name } : prev));
      setBanner({ type: "success", text: t("nameSaved") });
    } catch {
      setBanner({ type: "error", text: "حدث خطأ" });
    }
  };

  const inviteTeacher = async () => {
    if (!teacherEmail.trim() || !teacherEmail.includes("@")) return;
    setSending(true);
    setBanner(null);
    try {
      await api.post("/subscriptions/organizations/my/invites/", {
        email: teacherEmail.trim(),
        locale,
      });
      setTeacherEmail("");
      setBanner({ type: "success", text: t("inviteSent") });
      fetchOrg();
    } catch (err: any) {
      const error = err?.response?.data?.error;
      setBanner({ type: "error", text: error === "seats_limit_reached" ? t("seatsLimitReached") : "حدث خطأ" });
    } finally {
      setSending(false);
    }
  };

  const cancelInvite = async (token: string) => {
    try {
      await api.delete(`/subscriptions/organizations/my/invites/${token}/`);
      fetchOrg();
    } catch {}
  };

  const removeMember = async (id: number) => {
    if (!confirm(t("remove"))) return;
    try {
      await api.post(`/subscriptions/organizations/my/members/${id}/remove/`);
      fetchOrg();
    } catch {}
  };

  const setRole = async (id: number, role: string) => {
    try {
      await api.post(`/subscriptions/organizations/my/members/${id}/role/`, { role });
      fetchOrg();
    } catch {}
  };

  const copyInvite = async (token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/${locale}/join-organization?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setBanner({ type: "success", text: t("inviteCopied") });
    } catch {}
  };

  const buyExtraSeats = async () => {
    if (!org) return;
    setBuyingSeats(true);
    setBanner(null);
    try {
      const res = await api.post("/subscriptions/organizations/my/extra-seats/", {
        count: extraCount,
        locale,
      });
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }
      setBanner({ type: "error", text: ts("paymentNotAvailable") });
    } catch (err: any) {
      const error = err?.response?.data?.error;
      setBanner({ type: "error", text: error === "extra_seats_unavailable" ? t("noSeats") : "حدث خطأ" });
    } finally {
      setBuyingSeats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <svg className="animate-spin h-6 w-6" style={{ color: "var(--color-text-muted)" }} viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
      </div>
    );
  }

  if (unavailable || !org) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("title")}</h1>
          <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>{t("notAvailable")}</p>
          <button onClick={() => router.push(`/${locale}/subscriptions`)} className="px-6 py-3 rounded-2xl font-semibold text-white transition-all"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            {t("backToSubscriptions")}
          </button>
        </div>
      </div>
    );
  }

  const seatsPct = org.total_seats > 0 ? Math.min(100, (org.occupied_seats / org.total_seats) * 100) : 100;
  const seatsFull = org.occupied_seats >= org.total_seats;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("title")}</h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("subtitle")}</p>
        </div>

        {banner && (
          <div className="mb-6 px-4 py-3 rounded-2xl text-sm font-medium" style={{ background: banner.type === "success" ? "var(--color-success)" : "var(--color-error)", color: "#FFF" }}>
            {banner.type === "success" ? "✅ " : "⚠️ "}{banner.text}
          </div>
        )}

        <div className={surfaceCls + " p-5 mb-6"} style={surfaceStyle}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>{t("orgName")}</label>
              <div className="flex gap-2">
                <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)}
                  className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
                <button onClick={saveName} className="px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all shrink-0" style={{ background: "var(--color-primary)" }}>
                  {t("saveName")}
                </button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>{t("plan")}</p>
              <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{org.plan_name}</h3>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: org.status === "active" ? "var(--color-success)" : "var(--color-error)", color: "#FFF" }}>
                {org.status === "active" ? t("orgStatusActive") : t("orgStatusSuspended")}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("seats")}</span>
              <span style={{ color: seatsFull ? "var(--color-error)" : "var(--color-text-muted)" }}>
                {org.occupied_seats} / {org.total_seats} {t("seatsUsedOf")}
              </span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-background-secondary)" }}>
              <div className="h-2.5 rounded-full transition-all" style={{ width: `${seatsPct}%`, background: seatsFull ? "var(--color-error)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {t("extraSeats")}: {org.extra_seats}
              </p>
              <div className="flex items-center gap-2">
                <input type="number" min={1} max={50} value={extraCount} onChange={(e) => setExtraCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 px-3 py-2 border rounded-xl text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
                <button onClick={buyExtraSeats} disabled={buyingSeats} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40" style={{ background: "var(--color-secondary)" }}>
                  {buyingSeats ? t("redirectingToPayment") : t("buyExtraSeats")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {org.usage.length > 0 && (
          <div className={surfaceCls + " p-5 mb-6"} style={surfaceStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("usageTitle")}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>{t("usageNote")}</p>
            <div className="space-y-4">
              {org.usage.map((s) => {
                const name = s.name?.[locale] || s.name?.ar || s.name?.en || s.code;
                const unlimited = s.limit === null || s.limit === undefined;
                const exhausted = !unlimited && s.used >= (s.limit as number);
                const pct = unlimited ? 100 : Math.min(100, (s.used / Math.max(s.limit as number, 1)) * 100);
                return (
                  <div key={s.code}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{name}</span>
                      <span style={{ color: exhausted ? "var(--color-error)" : "var(--color-text-muted)" }}>
                        {unlimited ? `∞ ${t("unlimited")}` : `${s.used} / ${s.limit} ${t(s.period)}`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--color-background-secondary)" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: exhausted ? "var(--color-error)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className={surfaceCls + " p-5 mb-6"} style={surfaceStyle}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("members")}</h3>
          {org.occupied_seats >= org.total_seats ? (
            <p className="text-sm mb-4" style={{ color: "var(--color-error)" }}>{t("seatsLimitReached")}</p>
          ) : (
            <div className="flex gap-2 mb-4">
              <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder={t("teacherEmailPlaceholder")} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
              <button onClick={inviteTeacher} disabled={sending || !teacherEmail.includes("@")}
                className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-40 shrink-0" style={{ background: "var(--color-primary)" }}>
                {sending ? "..." : `+ ${t("addTeacher")}`}
              </button>
            </div>
          )}

          {org.members.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("noMembers")}</p>
          ) : (
            <div className="overflow-auto rounded-2xl border" style={{ borderColor: "var(--color-border)" }}>
              <table className="w-full">
                <thead style={{ background: "var(--color-background-secondary)" }}>
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("member")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("role")}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("status")}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {org.members.map((m) => (
                    <tr key={m.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{m.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {m.role === "manager" ? t("roleManager") : t("roleTeacher")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={m.status === "active"
                            ? { background: "var(--color-success)", color: "#FFF" }
                            : { background: "var(--color-warning)", color: "#FFF" }}>
                          {m.status === "active" ? t("statusActive") : t("statusPending")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 text-xs">
                          {m.status === "pending" && m.invite_token && (
                            <>
                              <button onClick={() => copyInvite(m.invite_token)} className="font-medium" style={{ color: "var(--color-primary)" }}>{t("inviteCopy")}</button>
                              <button onClick={() => cancelInvite(m.invite_token!)} className="font-medium" style={{ color: "var(--color-error)" }}>{t("cancelInvite")}</button>
                            </>
                          )}
                          {m.status === "active" && (
                            <>
                              {m.role === "teacher" ? (
                                <button onClick={() => setRole(m.id, "manager")} className="font-medium" style={{ color: "var(--color-primary)" }}>{t("promote")}</button>
                              ) : (
                                <button onClick={() => setRole(m.id, "teacher")} className="font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("demote")}</button>
                              )}
                              <button onClick={() => removeMember(m.id)} className="font-medium" style={{ color: "var(--color-error)" }}>{t("remove")}</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

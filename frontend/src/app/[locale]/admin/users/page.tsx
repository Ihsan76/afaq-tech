"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  subscription_plan: string;
  is_verified: boolean;
  is_staff: boolean;
  date_joined: string;
}

const ROLES = ["student", "teacher", "creator", "admin"];
const PLANS = ["free", "basic", "pro", "enterprise"];

const ROLE_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  student: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)", icon: "🎓" },
  teacher: { bg: "var(--color-success-light)", color: "var(--color-success)", icon: "👨‍🏫" },
  creator: { bg: "var(--color-accent-light)", color: "var(--color-accent)", icon: "✍️" },
  admin: { bg: "var(--color-warning-light)", color: "var(--color-warning)", icon: "👑" },
};

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  basic: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)" },
  pro: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  enterprise: { bg: "#fef3c7", color: "#d97706" },
};

export default function AdminUsersPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  useEffect(() => { fetchUsers(); }, [roleFilter, planFilter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (planFilter) params.set("plan", planFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/auth/admin/list/?${params.toString()}`);
      setUsers(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const updateUser = async (user: AdminUser, field: "role" | "subscription_plan", value: string) => {
    try {
      const res = await api.patch(`/auth/admin/${user.id}/`, { [field]: value });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, [field]: value } : u)));
    } catch {}
  };

  const selectCls = "px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer";
  const inputCls = "px-4 py-2 rounded-xl text-sm border";

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.users")} ({users.length})
        </h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder={t("admin.searchUsers")}
            className={inputCls}
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            <option value="">{t("admin.allRoles")}</option>
            {ROLES.map((r) => <option key={r} value={r}>{t(`dashboard.role${r.charAt(0).toUpperCase() + r.slice(1)}`)}</option>)}
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            <option value="">{t("admin.allPlans")}</option>
            {PLANS.map((p) => <option key={p} value={p}>{t(`dashboard.plan${p.charAt(0).toUpperCase() + p.slice(1)}`)}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>{t("admin.noUsers")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.email")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changeRole")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changePlan")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.verified")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("dashboard.memberSince")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const rc = ROLE_COLORS[user.role] || ROLE_COLORS.student;
                const pc = PLAN_COLORS[user.subscription_plan] || PLAN_COLORS.free;
                return (
                  <tr key={user.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                          {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>{user.name || user.email}</div>
                          <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user, "role", e.target.value)}
                        className={selectCls}
                        style={{ background: rc.bg, color: rc.color, borderColor: rc.color }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_COLORS[r]?.icon} {t(`dashboard.role${r.charAt(0).toUpperCase() + r.slice(1)}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={user.subscription_plan}
                        onChange={(e) => updateUser(user, "subscription_plan", e.target.value)}
                        className={selectCls}
                        style={{ background: pc.bg, color: pc.color, borderColor: pc.color }}
                      >
                        {PLANS.map((p) => (
                          <option key={p} value={p}>{t(`dashboard.plan${p.charAt(0).toUpperCase() + p.slice(1)}`)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_verified ? (
                        <span className="text-sm" style={{ color: "var(--color-success)" }}>✓</span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {user.date_joined ? new Date(user.date_joined).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  school_name?: string;
  role: string;
  subscription_plan: string;
  is_verified: boolean;
  is_staff: boolean;
  date_joined: string;
}

const ROLES = ["student", "teacher", "parent", "creator", "admin", "school_admin", "developer", "support", "content_manager", "finance"];
const PLANS = ["free", "basic", "pro", "school", "enterprise"];
const PAGE_SIZES = [20, 50, 100];
const SORTS = ["-date_joined", "date_joined", "name", "-name", "email"];

const ROLE_LABEL_KEYS: Record<string, string> = {
  student: "roleStudent",
  teacher: "roleTeacher",
  parent: "roleParent",
  creator: "roleCreator",
  admin: "roleAdmin",
  school_admin: "roleSchoolAdmin",
  developer: "roleDeveloper",
  support: "roleSupport",
  content_manager: "roleContentManager",
  finance: "roleFinance",
};

const SORT_LABEL_KEYS: Record<string, string> = {
  "-date_joined": "sortNewest",
  date_joined: "sortJoined",
  name: "sortName",
  "-name": "sortNameDesc",
  email: "sortEmail",
};

const ROLE_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  student: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)", icon: "🎓" },
  teacher: { bg: "var(--color-success-light)", color: "var(--color-success)", icon: "👨‍🏫" },
  parent: { bg: "#fdf4ff", color: "#a21caf", icon: "👪" },
  creator: { bg: "var(--color-accent-light)", color: "var(--color-accent)", icon: "✍️" },
  admin: { bg: "var(--color-warning-light)", color: "var(--color-warning)", icon: "👑" },
  school_admin: { bg: "#fff7ed", color: "#c2410c", icon: "🏫" },
  developer: { bg: "#eef2ff", color: "#4f46e5", icon: "🛠️" },
  support: { bg: "#ecfeff", color: "#0891b2", icon: "🎧" },
  content_manager: { bg: "#f0fdf4", color: "#16a34a", icon: "🗞️" },
  finance: { bg: "#fffbeb", color: "#b45309", icon: "💰" },
};

const PLAN_COLORS: Record<string, { bg: string; color: string }> = {
  free: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  basic: { bg: "var(--color-info-light, #e0f2fe)", color: "var(--color-info, #0284c7)" },
  pro: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  school: { bg: "#f0fdf4", color: "#16a34a" },
  enterprise: { bg: "#fef3c7", color: "#d97706" },
};

export default function AdminUsersPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const { user: currentUser } = useAuthStore();
  const canEdit = !!currentUser && (currentUser.is_staff || currentUser.role === "admin");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [sort, setSort] = useState("-date_joined");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (planFilter) params.set("plan", planFilter);
      if (search) params.set("search", search);
      if (schoolSearch) params.set("school", schoolSearch);
      if (sort) params.set("ordering", sort);
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      const res = await api.get(`/auth/admin/list/?${params.toString()}`);
      setUsers(res.data.results || []);
      setTotalCount(res.data.count ?? 0);
    } catch {} finally { setIsLoading(false); }
  }, [roleFilter, planFilter, search, schoolSearch, sort, page, pageSize]);

  useEffect(() => { fetchUsers(); }, [roleFilter, planFilter, sort, page, pageSize]);

  const applySearch = () => { setPage(1); fetchUsers(); };

  const updateUser = async (user: AdminUser, field: "role" | "subscription_plan", value: string) => {
    try {
      await api.patch(`/auth/admin/${user.id}/`, { [field]: value });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, [field]: value } : u)));
    } catch {}
  };

  const roleLabel = (r: string) => t(`dashboard.${ROLE_LABEL_KEYS[r] || "roleStudent"}`);

  const selectCls = "px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer";
  const inputCls = "px-4 py-2 rounded-xl text-sm border";

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.users")} ({totalCount.toLocaleString(locale === "ar" ? "ar-JO" : "en-US")})
        </h1>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder={t("admin.searchUsers")}
            className={inputCls}
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
          <input
            type="text"
            value={schoolSearch}
            onChange={(e) => setSchoolSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder={t("admin.searchSchool")}
            className={inputCls}
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            <option value="">{t("admin.allRoles")}</option>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          <select value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}>
            <option value="">{t("admin.allPlans")}</option>
            {PLANS.map((p) => <option key={p} value={p}>{t(`dashboard.plan${p.charAt(0).toUpperCase() + p.slice(1)}`)}</option>)}
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className={inputCls} style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }} title={t("admin.sortBy")}>
            {SORTS.map((s) => <option key={s} value={s}>{t(`admin.${SORT_LABEL_KEYS[s]}`)}</option>)}
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
        <>
        <div className="rounded-3xl border overflow-auto max-h-[650px]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.email")}</th>
                <th className="col-hide-lg px-6 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.school")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changeRole")}</th>
                <th className="col-hide-md px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changePlan")}</th>
                <th className="px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.verified")}</th>
                <th className="col-hide-lg px-6 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("dashboard.memberSince")}</th>
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
                          <Link href={`/${locale}/admin/users/${user.id}`} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 hover:opacity-95 transition-opacity" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                            {(user.name || user.email)?.[0]?.toUpperCase() || "?"}
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/${locale}/admin/users/${user.id}`} className="font-semibold text-sm truncate hover:underline block" style={{ color: "var(--color-text)" }}>
                              {user.name || user.email}
                            </Link>
                            <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{user.email}</div>
                          </div>
                        </div>
                      </td>
                    <td className="col-hide-lg px-6 py-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {user.school_name || <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {canEdit ? (
                        <select
                          value={user.role}
                          onChange={(e) => updateUser(user, "role", e.target.value)}
                          className={selectCls}
                          style={{ background: rc.bg, color: rc.color, borderColor: rc.color }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_COLORS[r]?.icon} {roleLabel(r)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={selectCls} style={{ background: rc.bg, color: rc.color, borderColor: rc.color, border: "1px solid" }}>
                          {rc.icon} {roleLabel(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="col-hide-md px-6 py-4 text-center">
                      {canEdit ? (
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
                      ) : (
                        <span className={selectCls} style={{ background: pc.bg, color: pc.color, borderColor: pc.color, border: "1px solid" }}>
                          {t(`dashboard.plan${user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)}`)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.is_verified ? (
                        <span className="text-sm" style={{ color: "var(--color-success)" }}>✓</span>
                      ) : (
                        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="col-hide-lg px-6 py-4 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {user.date_joined ? new Date(user.date_joined).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US") : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <span>{t("admin.page")} {page} {t("admin.of")} {totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              {t("admin.previousPage")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              {t("admin.nextPage")}
            </button>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
              title={t("admin.perPage")}
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

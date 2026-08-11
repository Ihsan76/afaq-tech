"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface AdminOrg {
  id: number;
  name: string;
  owner: number;
  owner_email: string;
  owner_name: string;
  plan: number;
  plan_code: string;
  plan_name: string;
  extra_seats: number;
  status: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

interface OrgMember {
  id: number;
  user: number | null;
  email: string;
  name: string;
  role: string;
  status: string;
  is_owner: boolean;
  invite_token: string | null;
  invited_at: string | null;
  joined_at: string | null;
}

interface AdminPlan {
  id: number;
  code: string;
  name: Record<string, string>;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

export default function AdminOrganizationsPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";

  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminOrg | null>(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [planId, setPlanId] = useState<number | "">("");
  const [extraSeats, setExtraSeats] = useState("0");
  const [status, setStatus] = useState("active");

  const [members, setMembers] = useState<OrgMember[]>([]);
  const [viewingMembers, setViewingMembers] = useState<AdminOrg | null>(null);

  const fetchOrgs = async () => {
    try {
      const res = await api.get("/subscriptions/admin/organizations/");
      setOrgs(res.data.results || res.data || []);
    } catch {} finally { setIsLoading(false); }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get("/subscriptions/admin/plans/");
      setPlans(res.data.results || res.data || []);
    } catch {}
  };

  useEffect(() => { fetchOrgs(); fetchPlans(); }, []);

  const resetForm = (open = false) => {
    setName(""); setOwnerEmail(""); setPlanId(""); setExtraSeats("0"); setStatus("active");
    setEditing(null); setError(""); setShowForm(open);
  };

  const startEdit = (org: AdminOrg) => {
    setEditing(org);
    setName(org.name);
    setOwnerEmail(org.owner_email);
    setPlanId(org.plan);
    setExtraSeats(String(org.extra_seats));
    setStatus(org.status);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(t("admin.orgNameRequired")); return; }
    if (!editing && !ownerEmail.trim()) { setError(t("admin.ownerEmailRequired")); return; }
    if (!planId) { setError(t("admin.organizationPlan")); return; }
    const payload = {
      name: name.trim(),
      extra_seats: Number(extraSeats) || 0,
      status,
      plan: planId,
    };
    try {
      if (editing) {
        await api.patch(`/subscriptions/admin/organizations/${editing.id}/`, payload);
      } else {
        await api.post("/subscriptions/admin/organizations/", { ...payload, owner_email: ownerEmail.trim() });
      }
      resetForm(); fetchOrgs();
    } catch (err: any) {
      const d = err.response?.data;
      setError(d?.owner_email || (d ? JSON.stringify(d) : t("common.error")));
    }
  };

  const handleDelete = async (org: AdminOrg) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/subscriptions/admin/organizations/${org.id}/`); fetchOrgs(); } catch {}
  };

  const loadMembers = async (org: AdminOrg) => {
    try {
      const res = await api.get(`/subscriptions/admin/organizations/${org.id}/members/`);
      setMembers(res.data.results || res.data || []);
    } catch { setMembers([]); }
    setViewingMembers(org);
  };

  const roleLabel = (role: string) =>
    role === "manager" ? t("organization.roleManager") : t("organization.roleTeacher");

  const statusLabel = (s: string) =>
    s === "active" ? t("admin.orgStatusActive") : t("admin.orgStatusSuspended");

  const planName = (code: string, name: Record<string, string>) =>
    (name && (name[locale] || name.ar || name.en)) || code || "-";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("admin.organizations")}</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationsDesc")}</p>
          </div>
          <button onClick={() => resetForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("admin.createOrganization")}</button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {editing ? t("common.edit") : t("admin.createOrganization")}
            </h2>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.organizationName")}</label>
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.organizationOwnerEmail")}</label>
                <input type="email" value={ownerEmail} onChange={(e) => { setOwnerEmail(e.target.value); setError(""); }} disabled={!!editing} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder="owner@school.edu" required={!editing} />
                {editing && <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{editing.owner_name} · {editing.owner_email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.organizationPlan")}</label>
                <SelectDropdown value={planId} onChange={(v) => { setPlanId(Number(v)); setError(""); }} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required>
                  <option value="">—</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{planName(p.code, p.name)} ({p.code})</option>
                  ))}
                </SelectDropdown>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.organizationExtraSeats")}</label>
                <input type="number" min="0" value={extraSeats} onChange={(e) => setExtraSeats(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("admin.organizationStatus")}</label>
                 <SelectDropdown value={status} onChange={(v) => setStatus(String(v))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                  <option value="active">{t("admin.orgStatusActive")}</option>
                  <option value="suspended">{t("admin.orgStatusSuspended")}</option>
                </SelectDropdown>
              </div>
              <div className="flex items-end gap-3">
                <button type="submit" className="text-white px-6 py-3 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={() => resetForm()} className="px-6 py-3 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : orgs.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationName")}</th>
                    <th className="col-hide-lg px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationOwnerEmail")}</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationPlan")}</th>
                    <th className="col-hide-sm px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationExtraSeats")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationStatus")}</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("admin.organizationMembers")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {orgs.map((org) => (
                    <tr key={org.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-4">
                        <p className="font-medium" style={{ color: "var(--color-text)" }}>{org.name}</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{org.owner_name}</p>
                      </td>
                      <td className="col-hide-lg px-6 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>{org.owner_email}</td>
                      <td className="col-hide-md px-6 py-4">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{org.plan_name}</p>
                        <p className="text-[11px] font-mono" style={{ color: "var(--color-text-muted)" }}>{org.plan_code}</p>
                      </td>
                      <td className="col-hide-sm px-6 py-4 font-mono text-sm" style={{ color: "var(--color-text-secondary)" }}>+{org.extra_seats}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${org.status === "active" ? "" : "opacity-70"}`}
                          style={{ background: org.status === "active" ? "var(--color-success)" : "var(--color-error)", color: "#FFF" }}>
                          {statusLabel(org.status)}
                        </span>
                      </td>
                      <td className="col-hide-md px-6 py-4">
                        <button onClick={() => loadMembers(org)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>
                          {org.member_count} {t("admin.organizationMembers")}
                        </button>
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => startEdit(org)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button onClick={() => handleDelete(org)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewingMembers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setViewingMembers(null)} />
            <div className="relative w-full max-w-2xl rounded-3xl p-6 max-h-[80vh] overflow-auto" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                  {viewingMembers.name} — {t("admin.organizationMembers")} ({members.length})
                </h2>
                <button onClick={() => setViewingMembers(null)} className="p-2 rounded-lg hover:opacity-70" style={{ color: "var(--color-text-muted)" }}>✕</button>
              </div>
              {members.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("organization.member")}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("organization.role")}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("organization.status")}</th>
                    </tr>
                  </thead>
                  <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                    {members.map((m) => (
                      <tr key={m.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{m.name || m.email}{m.is_owner && " ⭐"}</p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>{roleLabel(m.role)}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>{m.status === "active" ? t("organization.statusActive") : m.status === "pending" ? t("organization.statusPending") : t("organization.statusRemoved")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

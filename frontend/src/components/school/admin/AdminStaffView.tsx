"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { extractApiError } from "@/lib/apiErrors";

interface StaffMember {
  id: number;
  school: number;
  user: number;
  role: string;
  user_email: string;
  user_name: string;
  school_name: string;
  created_at: string;
}

interface AdminStaffViewProps {
  staff: StaffMember[];
  schoolId: string | null;
  refresh: () => void;
}

const STAFF_ROLES = [
  { value: "school_accountant", icon: "\u{1F4B0}", label_ar: "محاسب المدرسة", label_en: "School Accountant" },
  { value: "school_transport_officer", icon: "\u{1F68C}", label_ar: "مسؤول الحركة", label_en: "Transport Officer" },
  { value: "school_librarian", icon: "\u{1F4DA}", label_ar: "أمين المكتبة", label_en: "Librarian" },
];

export default function AdminStaffView({ staff, schoolId, refresh }: AdminStaffViewProps) {
  const t = useTranslations("school");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("school_accountant");
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";
  const surfaceCls = "rounded-3xl p-6 shadow-xl border";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !schoolId) return;
    setBusy(true);
    setBanner(null);
    try {
      await api.post("/schools/school-staff/", { school: schoolId, user_email: email, role });
      setEmail("");
      setName("");
      setBanner({ type: "success", text: isAr ? "تمت إضافة عضو الطاقم" : "Staff member added" });
      refresh();
    } catch (err: any) {
      setBanner({ type: "error", text: extractApiError(err) || (isAr ? "خطأ" : "Error") });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(isAr ? "هل أنت متأكد؟" : "Are you sure?")) return;
    try {
      await api.delete(`/schools/school-staff/${id}/`);
      refresh();
    } catch {
      setBanner({ type: "error", text: isAr ? "خطأ" : "Error" });
    }
  };

  return (
    <div className="space-y-6">
      {banner && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Staff Form */}
        <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {isAr ? "إضافة عضو طاقم" : "Add Staff Member"}
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {isAr ? "الاسم (اختياري)" : "Name (optional)"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
                {isAr ? "الدور" : "Role"}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputCls}
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-surface)" }}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.icon} {isAr ? r.label_ar : r.label_en}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full text-white py-2.5 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              {busy ? "..." : isAr ? "إضافة" : "Add"}
            </button>
          </form>
        </div>

        {/* Staff List */}
        <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {isAr ? "أعضاء الطاقم" : "Staff Members"} <span className="text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>({staff.length})</span>
          </h3>
          {staff.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {isAr ? "لا يوجد أعضاء طاقم بعد" : "No staff members yet"}
            </p>
          ) : (
            <div className="space-y-2 max-h-[26rem] overflow-y-auto">
              {staff.map((s) => {
                const roleInfo = STAFF_ROLES.find((r) => r.value === s.role);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-2xl">{roleInfo?.icon || "\u{1F464}"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {s.user_name}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        {s.user_email}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {isAr ? roleInfo?.label_ar : roleInfo?.label_en}
                    </span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                    >
                      {isAr ? "حذف" : "Delete"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

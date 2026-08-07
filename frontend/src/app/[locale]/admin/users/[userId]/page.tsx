"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const ROLES = ["student", "teacher", "parent", "creator", "admin", "school_admin", "developer", "support", "content_manager", "finance"];
const PLANS = ["free", "basic", "pro", "school", "enterprise"];

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

export default function AdminUserEditPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const t = useTranslations();
  const { user: currentUser } = useAuthStore();
  const canEdit = !!currentUser && (currentUser.is_staff || currentUser.role === "admin");

  const roleLabel = (r: string) => t(`dashboard.${ROLE_LABEL_KEYS[r] || "roleStudent"}`);
  const planLabel = (p: string) => t(`dashboard.plan${p.charAt(0).toUpperCase() + p.slice(1)}`);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    subscription_plan: "free",
    phone: "",
    national_id: "",
    is_verified: false,
    is_active: true,
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/auth/admin/${userId}/`);
      const u = res.data;
      setFormData({
        name: u.name || "",
        email: u.email || "",
        role: u.role || "student",
        subscription_plan: u.subscription_plan || "free",
        phone: u.phone || "",
        national_id: u.national_id || "",
        is_verified: u.is_verified ?? false,
        is_active: u.is_active ?? true,
      });
    } catch (err: any) {
      setErrorMsg("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await api.patch(`/auth/admin/${userId}/`, {
        role: formData.role,
        subscription_plan: formData.subscription_plan,
        phone: formData.phone,
        national_id: formData.national_id,
        is_verified: formData.is_verified,
        is_active: formData.is_active,
        translations: { ar: { name: formData.name } },
      });
      setSuccessMsg("تم حفظ التعديلات بنجاح");
      setTimeout(() => {
        router.push(`/${locale}/admin/users`);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all";

  if (isLoading) {
    return <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>;
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          تعديل بيانات المستخدم #{userId}
        </h1>
        <Link
          href={`/${locale}/admin/users`}
          className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
          style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
        >
          ← رجوع للقائمة
        </Link>
      </div>

      {successMsg && (
        <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-4 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-3xl border space-y-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>البريد الإلكتروني (غير قابل للتعديل)</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className={`${inputCls} opacity-60 cursor-not-allowed`}
            style={{ background: "var(--color-surface-alt)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>الاسم الكامل (أربعة مقاطع)</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!canEdit}
            className={inputCls}
            style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changeRole")}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{roleLabel(r)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.changePlan")}</label>
            <select
              value={formData.subscription_plan}
              onChange={(e) => setFormData({ ...formData, subscription_plan: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{planLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>رقم الهاتف</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={{ color: "var(--color-text-secondary)" }}>الرقم الوطني / التسلسلي</label>
            <input
              type="text"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              disabled={!canEdit}
              className={inputCls}
              style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_verified}
              onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
              disabled={!canEdit}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{t("admin.verified")}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={!canEdit}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{t("admin.active")}</span>
          </label>
        </div>

        {canEdit && (
          <div className="pt-4 border-t flex justify-end gap-3" style={{ borderColor: "var(--color-border)" }}>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

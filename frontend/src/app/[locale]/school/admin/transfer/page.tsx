"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { extractApiError } from "@/lib/apiErrors";

interface ManagerRequest {
  id: number;
  school: number;
  school_name: string;
  current_manager: number;
  current_manager_email: string;
  new_manager_email: string;
  reason: string;
  status: string;
  admin_notes: string;
  created_at: string;
  reviewed_at: string | null;
}

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: "قيد المراجعة", en: "Pending", color: "bg-amber-500/10 text-amber-600" },
  approved: { ar: "مقبول", en: "Approved", color: "bg-emerald-500/10 text-emerald-600" },
  rejected: { ar: "مرفوض", en: "Rejected", color: "bg-rose-500/10 text-rose-600" },
};

export default function SchoolTransferPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isAr = locale === "ar";

  const [requests, setRequests] = useState<ManagerRequest[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [reason, setReason] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSchool();
    fetchRequests();
  }, []);

  const fetchSchool = async () => {
    try {
      const res = await api.get("/schools/my-school-context/");
      setSchoolId(res.data?.school_id?.toString() || null);
    } catch {
      // ignore
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get("/schools/manager-requests/");
      setRequests(res.data?.results || res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !schoolId) return;
    setBusy(true);
    setBanner(null);
    try {
      await api.post("/schools/manager-requests/", {
        school: schoolId,
        new_manager_email: newEmail,
        reason,
      });
      setBanner({ type: "success", text: isAr ? "تم إرسال طلب النقل" : "Transfer request submitted" });
      setNewEmail("");
      setReason("");
      fetchRequests();
    } catch (err: any) {
      setBanner({ type: "error", text: extractApiError(err) || (isAr ? "خطأ" : "Error") });
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";
  const surfaceCls = "rounded-3xl p-6 shadow-xl border";

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto space-y-6" style={{ fontFamily: "var(--font-body)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--color-text-muted)" }}>
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span style={{ color: "var(--color-text-muted)" }}>/</span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "نقل المديرية" : "Transfer Ownership"}
        </h1>
      </div>

      {banner && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
          {banner.text}
        </div>
      )}

      <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "طلب نقل المديرية" : "Request Ownership Transfer"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {isAr ? "بريد المدير الجديد" : "New Manager Email"}
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={inputCls}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              placeholder="new-manager@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
              {isAr ? "سبب النقل" : "Reason for Transfer"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputCls}
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={busy || !newEmail}
            className="w-full text-white py-2.5 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {busy ? "..." : isAr ? "إرسال الطلب" : "Submit Request"}
          </button>
        </form>
      </div>

      <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "طلبات النقل السابقة" : "Previous Transfer Requests"}
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {isAr ? "لا توجد طلبات سابقة" : "No previous requests"}
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const statusInfo = STATUS_LABELS[req.status] || STATUS_LABELS.pending;
              return (
                <div key={req.id} className="p-3 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{"\u{1F504}"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {req.school_name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {isAr ? "إلى:" : "To:"} {req.new_manager_email}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                      {isAr ? statusInfo.ar : statusInfo.en}
                    </span>
                  </div>
                  {req.reason && (
                    <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
                      {isAr ? "السبب:" : "Reason:"} {req.reason}
                    </p>
                  )}
                  {req.admin_notes && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-primary)" }}>
                      {isAr ? "ملاحظات:" : "Notes:"} {req.admin_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

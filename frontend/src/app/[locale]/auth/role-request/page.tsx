"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { extractApiError } from "@/lib/apiErrors";

interface RoleRequest {
  id: number;
  request_type: string;
  status: string;
  admin_notes: string;
  commission_rate: number;
  created_at: string;
  reviewed_at: string | null;
}

const ROLE_OPTIONS = [
  { value: "instructor", icon: "\u{1F393}", label_ar: "مدرس / مدرب", label_en: "Instructor / Trainer" },
  { value: "publisher", icon: "\u{1F4D6}", label_ar: "ناشر", label_en: "Publisher" },
  { value: "provider", icon: "\u{1F527}", label_ar: "مقدم خدمات", label_en: "Service Provider" },
];

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: "قيد المراجعة", en: "Pending", color: "bg-amber-500/10 text-amber-600" },
  approved: { ar: "مقبول", en: "Approved", color: "bg-emerald-500/10 text-emerald-600" },
  rejected: { ar: "مرفوض", en: "Rejected", color: "bg-rose-500/10 text-rose-600" },
};

export default function RoleRequestPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const isAr = locale === "ar";

  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [requestType, setRequestType] = useState("instructor");
  const [privacy, setPrivacy] = useState(false);
  const [content, setContent] = useState(false);
  const [platform, setPlatform] = useState(false);
  const [legal, setLegal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/auth/my-requests/");
      setRequests(res.data?.results || res.data || []);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacy || !content || !platform || !legal) return;
    setBusy(true);
    setBanner(null);
    try {
      await api.post("/auth/role-requests/", {
        request_type: requestType,
        privacy_policy_accepted: privacy,
        content_ownership_confirmed: content,
        platform_rights_granted: platform,
        legal_review_acknowledged: legal,
      });
      setBanner({ type: "success", text: isAr ? "تم إرسال طلبك بنجاح" : "Your request has been submitted" });
      setPrivacy(false);
      setContent(false);
      setPlatform(false);
      setLegal(false);
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--color-text-muted)" }}>
          {isAr ? "الرئيسية" : "Home"}
        </Link>
        <span style={{ color: "var(--color-text-muted)" }}>/</span>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "طلب الأدوار" : "Role Requests"}
        </h1>
      </div>

      {banner && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
          {banner.text}
        </div>
      )}

      {/* Request Form */}
      <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "طلب دور جديد" : "New Role Request"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {isAr ? "اختر الدور" : "Select Role"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRequestType(opt.value)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    requestType === opt.value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50"
                  }`}
                >
                  <span className="text-3xl block mb-2">{opt.icon}</span>
                  <span className="text-sm font-semibold block" style={{ color: "var(--color-text)" }}>
                    {isAr ? opt.label_ar : opt.label_en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Legal Checkboxes */}
          <div className="space-y-3">
            {[
              { key: "privacy", label: isAr ? "أوافق على سياسة الخصوصية" : "I accept the Privacy Policy", state: privacy, setter: setPrivacy },
              { key: "content", label: isAr ? "أؤكد ملكية المحتوى" : "I confirm content ownership", state: content, setter: setContent },
              { key: "platform", label: isAr ? "أمنح المنصة الحقوق اللازمة" : "I grant platform necessary rights", state: platform, setter: setPlatform },
              { key: "legal", label: isAr ? "أقر بمراجعة الشروط القانونية" : "I acknowledge legal review", state: legal, setter: setLegal },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={(e) => item.setter(e.target.checked)}
                  className="w-5 h-5 rounded-lg accent-[var(--color-primary)]"
                />
                <span className="text-sm" style={{ color: "var(--color-text)" }}>{item.label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={busy || !privacy || !content || !platform || !legal}
            className="w-full text-white py-3 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {busy ? "..." : isAr ? "إرسال الطلب" : "Submit Request"}
          </button>
        </form>
      </div>

      {/* Previous Requests */}
      <div className={surfaceCls} style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {isAr ? "طلباتي السابقة" : "My Previous Requests"}
        </h2>
        {requests.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {isAr ? "لا توجد طلبات سابقة" : "No previous requests"}
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => {
              const roleInfo = ROLE_OPTIONS.find((r) => r.value === req.request_type);
              const statusInfo = STATUS_LABELS[req.status] || STATUS_LABELS.pending;
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-2xl">{roleInfo?.icon || "\u{1F4CB}"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {isAr ? roleInfo?.label_ar : roleInfo?.label_en}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(req.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
                    {isAr ? statusInfo.ar : statusInfo.en}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

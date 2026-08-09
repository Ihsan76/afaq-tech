"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function ParentWorkspace() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { user } = useAuthStore();

  const [familyLinks, setFamilyLinks] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [famRes, attRes, repRes, annRes, tickRes] = await Promise.all([
        api.get("/schools/family-links/").catch(() => ({ data: [] })),
        api.get("/schools/attendances/").catch(() => ({ data: [] })),
        api.get("/schools/weekly-summary/").catch(() => ({ data: [] })),
        api.get("/schools/announcements/").catch(() => ({ data: [] })),
        api.get("/schools/tickets/").catch(() => ({ data: [] })),
      ]);
      setFamilyLinks(Array.isArray(famRes.data) ? famRes.data : famRes.data.results || []);
      setAttendances(Array.isArray(attRes.data) ? attRes.data : attRes.data.results || []);
      setWeeklyReports(Array.isArray(repRes.data) ? repRes.data : repRes.data.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data.results || []);
      setTickets(Array.isArray(tickRes.data) ? tickRes.data : tickRes.data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex justify-between items-center mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white inline-block mb-2">
            {locale === "ar" ? "بوابة ولي الأمر" : "Parent Workspace"}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {user?.name_ar || user?.email}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ar" ? "متابعة الأبناء، الحضور، التقارير الأسبوعية والإعلانات المدرسية" : "Tracking children, attendance, weekly reports, and announcements"}
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-2xl text-sm font-bold bg-[var(--color-surface)] border" style={{ borderColor: "var(--color-border)" }}>
          {locale === "ar" ? "تحديث 🔄" : "Refresh 🔄"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Children & Attendance */}
          <div className="lg:col-span-2 space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                👨‍👩‍👧‍👦 {locale === "ar" ? "الأبناء المرتبطون (Family Links)" : "My Children"}
              </h3>
              {familyLinks.length === 0 ? (
                <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">
                  {locale === "ar" ? "لا توجد حسابات أبناء مرتبطة برقم هاتفك أو حسابك حالياً." : "No linked children found."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {familyLinks.map((f: any) => (
                    <div key={f.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                      <h4 className="font-bold text-lg">{f.student_name || f.student}</h4>
                      <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                        {locale === "ar" ? "صلة القرابة:" : "Relation:"} {f.relationship || "ولي أمر"} | {locale === "ar" ? "المدرسة:" : "School:"} {f.school_name || f.school}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                📊 {locale === "ar" ? "سجلات الحضور والغياب الأخيرة" : "Recent Attendance Records"}
              </h3>
              {attendances.length === 0 ? (
                <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">لا توجد سجلات حضور.</p>
              ) : (
                <div className="space-y-2">
                  {attendances.map((att: any) => (
                    <div key={att.id} className="p-3 rounded-xl bg-[var(--color-background)] border flex justify-between items-center text-sm" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <span className="font-bold">{att.student_name}</span> ({att.date})
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${att.status === "present" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                        {att.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Announcements & Reports */}
          <div className="space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                📢 {locale === "ar" ? "الإعلانات والتعاميم المدرسية" : "School Announcements"}
              </h3>
              {announcements.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">لا توجد إعلانات.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 5).map((ann: any) => (
                    <div key={ann.id} className="p-3 rounded-xl bg-[var(--color-background)] border text-xs" style={{ borderColor: "var(--color-border)" }}>
                      <p className="font-bold text-sm">{ann.title}</p>
                      <p className="text-[var(--color-text-secondary)] mt-1">{ann.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                💬 {locale === "ar" ? "التذاكر والتواصل مع الإدارة" : "Support Tickets"}
              </h3>
              {tickets.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">لا توجد تذاكر مسجلة.</p>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="p-3 rounded-xl bg-[var(--color-background)] border text-xs" style={{ borderColor: "var(--color-border)" }}>
                      <p className="font-bold">{t.subject || t.title}</p>
                      <p className="text-[var(--color-text-secondary)] mt-1">{t.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

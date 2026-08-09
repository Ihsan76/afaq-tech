"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function StudentWorkspace() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { user } = useAuthStore();

  const [timetable, setTimetable] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotRes, attRes, annRes] = await Promise.all([
        api.get("/schools/timetable-slots/").catch(() => ({ data: [] })),
        api.get("/schools/attendances/").catch(() => ({ data: [] })),
        api.get("/schools/announcements/").catch(() => ({ data: [] })),
      ]);
      setTimetable(Array.isArray(slotRes.data) ? slotRes.data : slotRes.data.results || []);
      setAttendances(Array.isArray(attRes.data) ? attRes.data : attRes.data.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data.results || []);
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
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white inline-block mb-2">
            {locale === "ar" ? "مساحة عمل الطالب" : "Student Workspace"}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {user?.name_ar || user?.email}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ar" ? "استعراض جدول الحصص، سجل الحضور، والإعلانات المدرسية" : "Viewing timetable, attendance records, and announcements"}
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
          <div className="lg:col-span-2 space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                📅 {locale === "ar" ? "جدول الحصص الدراسي" : "My Timetable"}
              </h3>
              {timetable.length === 0 ? (
                <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">لا توجد حصص مجدولة.</p>
              ) : (
                <div className="space-y-2">
                  {timetable.map((slot: any) => (
                    <div key={slot.id} className="p-3 rounded-xl bg-[var(--color-background)] border flex justify-between items-center text-sm" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <span className="font-bold text-[var(--color-primary)]">{slot.subject_name}</span> ({slot.section_name})
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {slot.day_display} — {slot.period_name} {slot.room_name ? `(${slot.room_name})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                📊 {locale === "ar" ? "سجل الحضور" : "Attendance History"}
              </h3>
              {attendances.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">لا توجد سجلات.</p>
              ) : (
                <div className="space-y-2">
                  {attendances.map((att: any) => (
                    <div key={att.id} className="p-3 rounded-xl bg-[var(--color-background)] border flex justify-between items-center text-xs" style={{ borderColor: "var(--color-border)" }}>
                      <span>{att.date}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold ${att.status === "present" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                        {att.status}
                      </span>
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

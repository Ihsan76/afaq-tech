"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function TeacherWorkspace() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { user } = useAuthStore();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick attendance marking state
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [attStatus, setAttStatus] = useState<string>("present");
  const [studentId, setStudentId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assRes, slotRes, tickRes] = await Promise.all([
        api.get("/schools/teacher-assignments/").catch(() => ({ data: [] })),
        api.get("/schools/timetable-slots/").catch(() => ({ data: [] })),
        api.get("/schools/tickets/").catch(() => ({ data: [] })),
      ]);
      setAssignments(Array.isArray(assRes.data) ? assRes.data : assRes.data.results || []);
      setTimetable(Array.isArray(slotRes.data) ? slotRes.data : slotRes.data.results || []);
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

  const recordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !studentId) return;
    try {
      await api.post("/schools/attendances/bulk_record/", {
        section_id: selectedSection,
        date: new Date().toISOString().split("T")[0],
        records: [{ student_id: Number(studentId), status: attStatus }]
      });
      setBanner({ type: "success", text: locale === "ar" ? "تم تسجيل الحضور بنجاح" : "Attendance recorded successfully" });
      setStudentId("");
    } catch {
      setBanner({ type: "error", text: locale === "ar" ? "فشل تسجيل الحضور" : "Failed to record attendance" });
    }
  };

  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex justify-between items-center mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-secondary)] text-white inline-block mb-2">
            {locale === "ar" ? "مساحة عمل المعلم" : "Teacher Workspace"}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {user?.name_ar || user?.email}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ar" ? "إدارة الحصص، رصد الحضور السريع، والرد على استفسارات أولياء الأمور" : "Managing classes, quick attendance, and parent tickets"}
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-2xl text-sm font-bold bg-[var(--color-surface)] border" style={{ borderColor: "var(--color-border)" }}>
          {locale === "ar" ? "تحديث 🔄" : "Refresh 🔄"}
        </button>
      </div>

      {banner && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
          {banner.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Top: Assignments & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "📚 الشعب والمواد المسندة إليك" : "Your Assigned Classes & Subjects"}
              </h3>
              {assignments.length === 0 ? (
                <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">
                  {locale === "ar" ? "لا توجد إسنادات تدريسية مسجلة لك حالياً." : "No teacher assignments found."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.map((as: any) => (
                    <div key={as.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                      <h4 className="font-bold text-lg">{as.subject_name || as.subject}</h4>
                      <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                        {locale === "ar" ? "الشعبة:" : "Section:"} {as.section_name || as.section} | {locale === "ar" ? "المدرسة:" : "School:"} {as.school_name || as.school}
                      </p>
                      <button
                        onClick={() => setSelectedSection(as.section)}
                        className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)]"
                      >
                        {locale === "ar" ? "تسجيل حضور لهذه الشعبة ✓" : "Record Attendance ✓"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "📅 جدول الحصص الأسبوعي" : "Weekly Timetable"}
              </h3>
              {timetable.length === 0 ? (
                <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">لا توجد حصص مجدولة حالياً.</p>
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

          {/* Right / Bottom: Quick Attendance & Tickets */}
          <div className="space-y-6">
            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "🚨 تسجيل حضور سريع للحصة" : "Quick Attendance"}
              </h3>
              <form onSubmit={recordAttendance} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">اختر الشعبة</label>
                  <select
                    value={selectedSection || ""}
                    onChange={(e) => setSelectedSection(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">-- اختر الشعبة --</option>
                    {assignments.map((as: any) => (
                      <option key={as.section} value={as.section}>{as.section_name || `شعبة #${as.section}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">معرف الطالب (Student ID)</label>
                  <input
                    type="number"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="ID الطالب"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">الحالة</label>
                  <select
                    value={attStatus}
                    onChange={(e) => setAttStatus(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="present">حاضر (Present)</option>
                    <option value="absent">غائب (Absent - يرسل واتساب تلقائي)</option>
                    <option value="late">متأخر (Late)</option>
                  </select>
                </div>
                <button type="submit" className="w-full py-3 rounded-2xl font-bold text-white bg-[var(--color-secondary)] shadow-lg hover:opacity-90">
                  {locale === "ar" ? "حفظ وإرسال التنبيه 🚀" : "Save & Notify 🚀"}
                </button>
              </form>
            </div>

            <div className={surfaceCls} style={surfaceStyle}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                {locale === "ar" ? "💬 تذاكر أولياء الأمور" : "Parent Tickets"}
              </h3>
              {tickets.length === 0 ? (
                <p className="text-xs text-[var(--color-text-secondary)]">لا توجد تذاكر حالية.</p>
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

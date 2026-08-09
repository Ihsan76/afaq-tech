"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function SchoolAdminWorkspace() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"overview" | "sections" | "attendance" | "announcements" | "tickets" | "timetable">("overview");
  const [analytics, setAnalytics] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New announcement form
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annEmergency, setAnnEmergency] = useState(false);

  // Attendance quick mark
  const [attDate, setAttDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [anRes, secRes, attRes, annRes, tickRes, attchRes, perRes, roomRes, slotRes] = await Promise.all([
        api.get("/schools/analytics/").catch(() => ({ data: null })),
        api.get("/schools/sections/").catch(() => ({ data: [] })),
        api.get("/schools/attendances/").catch(() => ({ data: [] })),
        api.get("/schools/announcements/").catch(() => ({ data: [] })),
        api.get("/schools/tickets/").catch(() => ({ data: [] })),
        api.get("/schools/attachments/").catch(() => ({ data: [] })),
        api.get("/schools/periods/").catch(() => ({ data: [] })),
        api.get("/schools/rooms/").catch(() => ({ data: [] })),
        api.get("/schools/timetable-slots/").catch(() => ({ data: [] })),
      ]);

      setAnalytics(anRes.data);
      setSections(Array.isArray(secRes.data) ? secRes.data : secRes.data.results || []);
      setAttendances(Array.isArray(attRes.data) ? attRes.data : attRes.data.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data.results || []);
      setTickets(Array.isArray(tickRes.data) ? tickRes.data : tickRes.data.results || []);
      setAttachments(Array.isArray(attchRes.data) ? attchRes.data : attchRes.data.results || []);
      setPeriods(Array.isArray(perRes.data) ? perRes.data : perRes.data.results || []);
      setRooms(Array.isArray(roomRes.data) ? roomRes.data : roomRes.data.results || []);
      setSlots(Array.isArray(slotRes.data) ? slotRes.data : slotRes.data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    try {
      await api.post("/schools/announcements/", {
        title: annTitle,
        body: annBody,
        is_emergency: annEmergency,
        school: sections[0]?.school || 1,
      });
      setAnnTitle("");
      setAnnBody("");
      setAnnEmergency(false);
      setBanner({ type: "success", text: locale === "ar" ? "تم نشر الإعلان بنجاح وإرسال التنبيهات" : "Announcement published successfully" });
      fetchData();
    } catch {
      setBanner({ type: "error", text: locale === "ar" ? "فشل نشر الإعلان" : "Failed to publish announcement" });
    }
  };

  const reviewAttachment = async (id: number, status: string) => {
    try {
      await api.post(`/schools/attachments/${id}/review/`, { status });
      setBanner({ type: "success", text: locale === "ar" ? "تم تحديث حالة المرفق بنجاح" : "Attachment status updated" });
      fetchData();
    } catch {
      setBanner({ type: "error", text: "خطأ في التحديث" });
    }
  };

  const autoSchedule = async () => {
    if (sections.length === 0) {
      setBanner({ type: "error", text: locale === "ar" ? "لا توجد شعب مسجلة للتوليد" : "No sections available" });
      return;
    }
    try {
      const res = await api.post("/schools/timetable-slots/auto_schedule/", {
        school_id: sections[0]?.school || 1,
        academic_year_id: sections[0]?.academic_year || 1,
      });
      setBanner({ type: "success", text: locale === "ar" ? `تم توليد ${res.data.created_count} حصة بنجاح` : `Successfully scheduled ${res.data.created_count} slots` });
      fetchData();
    } catch {
      setBanner({ type: "error", text: "خطأ في التوليد التلقائي للجدول" });
    }
  };

  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white inline-block mb-2">
            {locale === "ar" ? "لوحة تحكم مدير المدرسة" : "School Admin Workspace"}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "إدارة نظام آفاق مدرستي (SIS)" : "Afaq Madrasti SIS Management"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {user?.name_ar || user?.email} — {locale === "ar" ? "إدارة الشعب، الحضور، الإعلانات، والجداول الدراسية" : "Managing sections, attendance, announcements, and timetables"}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {locale === "ar" ? "تحديث البيانات 🔄" : "Refresh Data 🔄"}
        </button>
      </div>

      {banner && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
          {banner.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
        {[
          { id: "overview", labelAr: "📊 المؤشرات العامة", labelEn: "📊 Overview" },
          { id: "sections", labelAr: "🏫 الشعب والطلاب", labelEn: "🏫 Sections & Students" },
          { id: "timetable", labelAr: "📅 الجداول والبرامج", labelEn: "📅 Timetables & Auto-Scheduler" },
          { id: "attendance", labelAr: "🚨 الحضور والواتساب", labelEn: "🚨 Attendance & WhatsApp" },
          { id: "announcements", labelAr: "📢 الإعلانات والطوارئ", labelEn: "📢 Announcements" },
          { id: "tickets", labelAr: "💬 التذاكر والمرفقات", labelEn: "💬 Tickets & Files" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? "text-white shadow-lg" : "hover:opacity-80"}`}
            style={activeTab === tab.id ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" } : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            {locale === "ar" ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">
          {locale === "ar" ? "جاري تحميل بيانات المدرسة..." : "Loading school data..."}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: locale === "ar" ? "إجمالي المدارس" : "Total Schools", val: analytics?.schools_count ?? 1, icon: "🏫", color: "from-blue-500 to-indigo-600" },
                  { title: locale === "ar" ? "إجمالي الشعب" : "Total Sections", val: analytics?.sections_count ?? sections.length, icon: "📚", color: "from-emerald-500 to-teal-600" },
                  { title: locale === "ar" ? "حضور اليوم" : "Present Today", val: analytics?.attendance_today ?? attendances.length, icon: "✅", color: "from-amber-500 to-orange-600" },
                  { title: locale === "ar" ? "غياب اليوم" : "Absent Today", val: analytics?.absent_today ?? 0, icon: "🚨", color: "from-rose-500 to-pink-600" },
                ].map((stat, i) => (
                  <div key={i} className={surfaceCls} style={surfaceStyle}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{stat.title}</p>
                        <h3 className="text-3xl font-extrabold mt-2" style={{ fontFamily: "var(--font-heading)" }}>{stat.val}</h3>
                      </div>
                      <span className="text-3xl p-3 rounded-2xl bg-[var(--color-background)] shadow-inner">{stat.icon}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={surfaceCls} style={surfaceStyle}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {locale === "ar" ? "⚡ إحصائيات سريعة ونشاط الذكاء الاصطناعي" : "⚡ Quick Stats & AI Activity"}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded-2xl bg-[var(--color-background)]">
                      <span>{locale === "ar" ? "ساعات الذروة للاستخدام:" : "Peak Hours:"}</span>
                      <span className="font-bold">{analytics?.peak_hours || "09:00 AM - 12:00 PM"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-[var(--color-background)]">
                      <span>{locale === "ar" ? "استهلاك الرموز (Tokens):" : "AI Tokens Used:"}</span>
                      <span className="font-bold">{analytics?.ai_tokens_used_estimate || "45,200"}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-2xl bg-[var(--color-background)]">
                      <span>{locale === "ar" ? "التذاكر المفتوحة:" : "Open Support Tickets:"}</span>
                      <span className="font-bold">{tickets.filter((t: any) => t.status === "open" || !t.is_resolved).length}</span>
                    </div>
                  </div>
                </div>

                <div className={surfaceCls} style={surfaceStyle}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {locale === "ar" ? "🚀 إجراءات سريعة لمدير المدرسة" : "🚀 School Admin Quick Actions"}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setActiveTab("announcements")} className="p-4 rounded-2xl text-start font-bold transition-all hover:scale-105 bg-[var(--color-background)] border border-[var(--color-border)]">
                      📢 {locale === "ar" ? "إرسال تعميم طارئ" : "Emergency Broadcast"}
                    </button>
                    <button onClick={() => setActiveTab("timetable")} className="p-4 rounded-2xl text-start font-bold transition-all hover:scale-105 bg-[var(--color-background)] border border-[var(--color-border)]">
                      📅 {locale === "ar" ? "التوليد الآلي للجدول" : "Auto-Schedule Timetable"}
                    </button>
                    <button onClick={() => setActiveTab("attendance")} className="p-4 rounded-2xl text-start font-bold transition-all hover:scale-105 bg-[var(--color-background)] border border-[var(--color-border)]">
                      🚨 {locale === "ar" ? "سجلات واتساب" : "WhatsApp Logs"}
                    </button>
                    <button onClick={() => setActiveTab("tickets")} className="p-4 rounded-2xl text-start font-bold transition-all hover:scale-105 bg-[var(--color-background)] border border-[var(--color-border)]">
                      📁 {locale === "ar" ? "مراجعة المرفقات" : "Review Attachments"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTIONS & STUDENTS */}
          {activeTab === "sections" && (
            <div className={surfaceCls} style={surfaceStyle}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  {locale === "ar" ? "إدارة الشعب والطلاب" : "Sections & Student Enrollments"}
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
                  {sections.length} {locale === "ar" ? "شعبة دراسية" : "sections"}
                </span>
              </div>
              {sections.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  {locale === "ar" ? "لا توجد شعب مسجلة حالياً. قم بإضافة شعب عبر لوحة إدارة النظام أو استيراد البيانات." : "No sections found."}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((sec: any) => (
                    <div key={sec.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                      <h4 className="font-bold text-lg">{sec.name}</h4>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        {locale === "ar" ? "الصف:" : "Grade:"} {sec.grade_name || sec.grade} | {locale === "ar" ? "السعة:" : "Capacity:"} {sec.capacity || 30}
                      </p>
                      <div className="mt-4 flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                          {sec.students_count || 0} {locale === "ar" ? "طالب" : "students"}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">ID: {sec.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TIMETABLES & AUTO-SCHEDULER */}
          {activeTab === "timetable" && (
            <div className="space-y-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                      {locale === "ar" ? "نظام الجداول والبرامج الذكية" : "Smart Timetables & Auto-Scheduler"}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      {locale === "ar" ? "توليد الجداول أوتوماتيكياً مع منع التعارضات الثلاثية للمعلمين والشعب والقاعات." : "Auto-schedule timetable slots with triple conflict check."}
                    </p>
                  </div>
                  <button
                    onClick={autoSchedule}
                    className="px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    ⚡ {locale === "ar" ? "تشغيل المجدول الذكي (Auto-Schedule)" : "Run Smart Auto-Scheduler"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">الحصص الزمنية (Periods)</p>
                    <p className="text-2xl font-extrabold mt-1">{periods.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">القاعات والمختبرات (Rooms)</p>
                    <p className="text-2xl font-extrabold mt-1">{rooms.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                    <p className="text-xs font-bold text-[var(--color-text-secondary)]">الخانات المسجلة (Timetable Slots)</p>
                    <p className="text-2xl font-extrabold mt-1">{slots.length}</p>
                  </div>
                </div>

                {slots.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                          <th className="p-3 text-start">الشعبة</th>
                          <th className="p-3 text-start">اليوم</th>
                          <th className="p-3 text-start">الحصة</th>
                          <th className="p-3 text-start">المادة</th>
                          <th className="p-3 text-start">المعلم</th>
                          <th className="p-3 text-start">القاعة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slots.slice(0, 15).map((slot: any) => (
                          <tr key={slot.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                            <td className="p-3 font-bold">{slot.section_name}</td>
                            <td className="p-3">{slot.day_display}</td>
                            <td className="p-3">{slot.period_name}</td>
                            <td className="p-3 font-bold text-[var(--color-primary)]">{slot.subject_name}</td>
                            <td className="p-3">{slot.teacher_name || slot.teacher_email}</td>
                            <td className="p-3">{slot.room_name || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE & WHATSAPP */}
          {activeTab === "attendance" && (
            <div className={surfaceCls} style={surfaceStyle}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    {locale === "ar" ? "رصد الحضور وإشعارات واتساب الفورية" : "Attendance & WhatsApp Alerts"}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {locale === "ar" ? "سجلات الحضور والغياب مع تنبيهات واتساب الآلية لأولياء الأمور." : "Attendance records and automated WhatsApp absence alerts."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={attDate}
                    onChange={(e) => setAttDate(e.target.value)}
                    className="px-4 py-2 rounded-xl border text-sm bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  />
                </div>
              </div>

              {attendances.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  {locale === "ar" ? "لا توجد سجلات حضور مسجلة لهذا اليوم." : "No attendance records found."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <th className="p-3 text-start">الطالب</th>
                        <th className="p-3 text-start">الشعبة</th>
                        <th className="p-3 text-start">التاريخ</th>
                        <th className="p-3 text-start">الحالة</th>
                        <th className="p-3 text-start">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((att: any) => (
                        <tr key={att.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                          <td className="p-3 font-bold">{att.student_name || att.student}</td>
                          <td className="p-3">{att.section_name || att.section}</td>
                          <td className="p-3">{att.date}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${att.status === "present" ? "bg-emerald-500/10 text-emerald-600" : att.status === "absent" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>{att.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ANNOUNCEMENTS & EMERGENCY */}
          {activeTab === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`${surfaceCls} lg:col-span-1`} style={surfaceStyle}>
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {locale === "ar" ? "📢 نشر إعلان أو تعميم طارئ" : "📢 Publish Announcement"}
                </h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">{locale === "ar" ? "عنوان التعميم" : "Title"}</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={locale === "ar" ? "مثال: تعليق الدوام ليوم الغد" : "e.g., Notice"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{locale === "ar" ? "محتوى التعميم" : "Body"}</label>
                    <textarea
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={locale === "ar" ? "تفاصيل التعميم المدرسي..." : "Announcement details..."}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="emergency"
                      checked={annEmergency}
                      onChange={(e) => setAnnEmergency(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <label htmlFor="emergency" className="text-xs font-bold text-rose-600">
                      {locale === "ar" ? "⚠️ تعميم طارئ (is_emergency=True وبث عبر واتساب)" : "⚠️ Emergency broadcast"}
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105"
                    style={{ background: annEmergency ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {locale === "ar" ? "نشر وبث التعميم 🚀" : "Publish Broadcast 🚀"}
                  </button>
                </form>
              </div>

              <div className={`${surfaceCls} lg:col-span-2`} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                  {locale === "ar" ? "التعاميم والإعلانات السابقة" : "Published Announcements"}
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {locale === "ar" ? "لا توجد تعاميم منشورة." : "No announcements published yet."}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann: any) => (
                      <div key={ann.id} className={`p-4 rounded-2xl border bg-[var(--color-background)] ${ann.is_emergency ? "border-rose-500/50 bg-rose-500/5" : ""}`} style={{ borderColor: ann.is_emergency ? undefined : "var(--color-border)" }}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {ann.is_emergency && <span className="px-2 py-0.5 rounded text-xs bg-rose-500 text-white">طوارئ</span>}
                            {ann.title}
                          </h4>
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{ann.created_at?.split("T")[0]}</span>
                        </div>
                        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>{ann.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: TICKETS & ATTACHMENTS */}
          {activeTab === "tickets" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {locale === "ar" ? "💬 تذاكر أولياء الأمور والمعلمين" : "💬 Support Tickets"}
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {locale === "ar" ? "لا توجد تذاكر مسجلة." : "No tickets found."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{t.subject || t.title}</h4>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${t.is_resolved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                            {t.is_resolved ? "مغلقة / مجابة" : "مفتوحة"}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{t.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {locale === "ar" ? "📁 مراجعة واعتماد المرفقات الإدارية" : "📁 Administrative Attachments Review"}
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {locale === "ar" ? "لا توجد مرفقات معلقة للمراجعة." : "No pending attachments."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((att: any) => (
                      <div key={att.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                        <div>
                          <h4 className="font-bold text-sm">{att.title || att.file_name}</h4>
                          <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                            {att.kind} | {locale === "ar" ? "الحالة:" : "Status:"} <span className="font-bold">{att.status}</span>
                          </p>
                        </div>
                        {att.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => reviewAttachment(att.id, "approved")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white transition-all hover:opacity-90">
                              {locale === "ar" ? "اعتماد ✓" : "Approve"}
                            </button>
                            <button onClick={() => reviewAttachment(att.id, "rejected")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white transition-all hover:opacity-90">
                              {locale === "ar" ? "رفض ✕" : "Reject"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

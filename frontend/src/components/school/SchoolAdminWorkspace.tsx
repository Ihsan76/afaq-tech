"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import SchoolSelector from "@/components/school/SchoolSelector";
import { resolveActiveSchoolId } from "@/components/school/activeSchool";

interface SchoolAdminWorkspaceProps {
  task: "overview" | "sections" | "timetable" | "attendance" | "announcements" | "tickets";
}

const TASKS = [
  { id: "overview", href: "/school/admin", labelKey: "navOverview" },
  { id: "sections", href: "/school/admin/sections", labelKey: "navSections" },
  { id: "timetable", href: "/school/admin/timetable", labelKey: "navTimetable" },
  { id: "attendance", href: "/school/admin/attendance", labelKey: "navAttendance" },
  { id: "announcements", href: "/school/admin/announcements", labelKey: "navAnnouncements" },
  { id: "tickets", href: "/school/admin/tickets", labelKey: "navTickets" },
] as const;

export default function SchoolAdminWorkspace({ task }: SchoolAdminWorkspaceProps) {
  const locale = useLocale();
  const t = useTranslations("school");
  const { user } = useAuthStore();

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
      const schoolId = await resolveActiveSchoolId();
      const schoolParam = schoolId ? `?school=${schoolId}` : "";
      const [secRes, attRes, annRes, tickRes, attchRes, perRes, roomRes, slotRes] = await Promise.all([
        api.get(`/schools/sections/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/attendances/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/announcements/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/tickets/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/attachments/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/periods/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/rooms/${schoolParam}`).catch(() => ({ data: [] })),
        api.get(`/schools/timetable-slots/${schoolParam}`).catch(() => ({ data: [] })),
      ]);

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
      setBanner({ type: "success", text: t("bannerAnnPublished") });
      fetchData();
    } catch {
      setBanner({ type: "error", text: t("bannerAnnFailed") });
    }
  };

  const reviewAttachment = async (id: number, status: string) => {
    try {
      await api.post(`/schools/attachments/${id}/review/`, { status });
      setBanner({ type: "success", text: t("bannerAttUpdated") });
      fetchData();
    } catch {
      setBanner({ type: "error", text: t("bannerAttError") });
    }
  };

  const autoSchedule = async () => {
    if (sections.length === 0) {
      setBanner({ type: "error", text: t("bannerNoSections") });
      return;
    }
    try {
      const res = await api.post("/schools/timetable-slots/auto_schedule/", {
        school_id: sections[0]?.school || 1,
        academic_year_id: sections[0]?.academic_year || 1,
      });
      setBanner({ type: "success", text: t("bannerScheduled", { count: res.data.created_count }) });
      fetchData();
    } catch {
      setBanner({ type: "error", text: t("bannerScheduleError") });
    }
  };

  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  const statusLabel = (status: string) =>
    status === "present" ? t("statusPresent") : status === "absent" ? t("statusAbsent") : status === "late" ? t("statusLate") : status;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)] text-white inline-block mb-2">
            {t("adminBadge")}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("adminTitle")}
          </h1>
          <div className="mt-2 inline-block">
            <SchoolSelector />
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {user?.name_ar || user?.email} — {t("adminSubtitle")}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {t("refresh")}
        </button>
      </div>

      {banner && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border border-rose-500/20"}`}>
          {banner.text}
        </div>
      )}

      {/* Task nav */}
      <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
        {TASKS.map((tab) => {
          const active = tab.id === task || (tab.id === "overview" && task === "overview");
          return (
            <Link
              key={tab.id}
              href={`/${locale}${tab.href}`}
              className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${active ? "text-white shadow-lg" : "hover:opacity-80"}`}
              style={active ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" } : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-lg font-bold">{t("loading")}</div>
      ) : (
        <>
          {/* SECTIONS & STUDENTS */}
          {task === "sections" && (
            <div className={surfaceCls} style={surfaceStyle}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("sectionsHeading")}
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
                  {t("sectionsCount", { count: sections.length })}
                </span>
              </div>
              {sections.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  {t("sectionsEmpty")}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sections.map((sec: any) => (
                    <div key={sec.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                      <h4 className="font-bold text-lg">{sec.name}</h4>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        {t("gradeLabel")} {sec.grade_name || sec.grade} | {t("capacityLabel")} {sec.capacity || 30}
                      </p>
                      <div className="mt-4 flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
                          {t("studentsCount", { count: sec.students_count || 0 })}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">ID: {sec.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TIMETABLES & AUTO-SCHEDULER */}
          {task === "timetable" && (
            <div className={surfaceCls} style={surfaceStyle}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    {t("timetableHeading")}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("timetableSubtitle")}
                  </p>
                </div>
                <button
                  onClick={autoSchedule}
                  className="px-6 py-3 rounded-2xl font-bold text-white shadow-xl transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  {t("runAutoScheduler")}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statPeriods")}</p>
                  <p className="text-2xl font-extrabold mt-1">{periods.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statRooms")}</p>
                  <p className="text-2xl font-extrabold mt-1">{rooms.length}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--color-background)] border">
                  <p className="text-xs font-bold text-[var(--color-text-secondary)]">{t("statSlots")}</p>
                  <p className="text-2xl font-extrabold mt-1">{slots.length}</p>
                </div>
              </div>

              {slots.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <th className="p-3 text-start">{t("colSection")}</th>
                        <th className="p-3 text-start">{t("colDay")}</th>
                        <th className="p-3 text-start">{t("colPeriod")}</th>
                        <th className="p-3 text-start">{t("colSubject")}</th>
                        <th className="p-3 text-start">{t("colTeacher")}</th>
                        <th className="p-3 text-start">{t("colRoom")}</th>
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
          )}

          {/* ATTENDANCE & WHATSAPP */}
          {task === "attendance" && (
            <div className={surfaceCls} style={surfaceStyle}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    {t("attendanceHeading")}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("attendanceSubtitle")}
                  </p>
                </div>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="px-4 py-2 rounded-xl border text-sm bg-[var(--color-background)]"
                  style={{ borderColor: "var(--color-border)" }}
                />
              </div>

              {attendances.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                  {t("attendanceEmpty")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <th className="p-3 text-start">{t("colStudent")}</th>
                        <th className="p-3 text-start">{t("colSection")}</th>
                        <th className="p-3 text-start">{t("colDate")}</th>
                        <th className="p-3 text-start">{t("colStatus")}</th>
                        <th className="p-3 text-start">{t("colNotes")}</th>
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
                              {statusLabel(att.status)}
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

          {/* ANNOUNCEMENTS & EMERGENCY */}
          {task === "announcements" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`${surfaceCls} lg:col-span-1`} style={surfaceStyle}>
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("annHeading")}
                </h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("annTitleLabel")}</label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={t("annTitlePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("annBodyLabel")}</label>
                    <textarea
                      value={annBody}
                      onChange={(e) => setAnnBody(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={t("annBodyPlaceholder")}
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
                      {t("annEmergencyLabel")}
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105"
                    style={{ background: annEmergency ? "linear-gradient(135deg, #f43f5e, #e11d48)" : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {t("annPublish")}
                  </button>
                </form>
              </div>

              <div className={`${surfaceCls} lg:col-span-2`} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("annListHeading")}
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {t("annEmpty")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((ann: any) => (
                      <div key={ann.id} className={`p-4 rounded-2xl border bg-[var(--color-background)] ${ann.is_emergency ? "border-rose-500/50 bg-rose-500/5" : ""}`} style={{ borderColor: ann.is_emergency ? undefined : "var(--color-border)" }}>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {ann.is_emergency && <span className="px-2 py-0.5 rounded text-xs bg-rose-500 text-white">{t("emergencyBadge")}</span>}
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

          {/* TICKETS & ATTACHMENTS */}
          {task === "tickets" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("ticketsHeading")}
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {t("ticketsEmpty")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((tick: any) => (
                      <div key={tick.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{tick.subject || tick.title}</h4>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${tick.is_resolved ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                            {tick.is_resolved ? t("ticketResolved") : t("ticketOpen")}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{tick.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("attachmentsHeading")}
                </h3>
                {attachments.length === 0 ? (
                  <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {t("attachmentsEmpty")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((att: any) => (
                      <div key={att.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                        <div>
                          <h4 className="font-bold text-sm">{att.title || att.file_name}</h4>
                          <p className="text-xs mt-0.5 text-[var(--color-text-secondary)]">
                            {att.kind} | {t("statusLabel")} <span className="font-bold">{att.status}</span>
                          </p>
                        </div>
                        {att.status === "pending" && (
                          <div className="flex gap-2">
                            <button onClick={() => reviewAttachment(att.id, "approved")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white transition-all hover:opacity-90">
                              {t("approve")}
                            </button>
                            <button onClick={() => reviewAttachment(att.id, "rejected")} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white transition-all hover:opacity-90">
                              {t("reject")}
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

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface TeacherWorkspaceProps {
  task: "timetable" | "attendance" | "tickets";
}

const TASKS = [
  { id: "overview", href: "/teacher", labelKey: "navOverview" },
  { id: "timetable", href: "/teacher/timetable", labelKey: "navTimetable" },
  { id: "attendance", href: "/teacher/attendance", labelKey: "navAttendance" },
  { id: "tickets", href: "/teacher/tickets", labelKey: "navTickets" },
] as const;

export default function TeacherWorkspace({ task }: TeacherWorkspaceProps) {
  const locale = useLocale();
  const t = useTranslations("school");
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
      setBanner({ type: "success", text: t("bannerAttUpdated") });
      setStudentId("");
    } catch {
      setBanner({ type: "error", text: t("bannerAttError") });
    }
  };

  const surfaceCls = "rounded-3xl p-6 shadow-xl border";
  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--card-shadow)" };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex justify-between items-center mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-secondary)] text-white inline-block mb-2">
            {t("teacherBadge")}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {user?.name_ar || user?.email}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {t("teacherSubtitle")}
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-2xl text-sm font-bold bg-[var(--color-surface)] border" style={{ borderColor: "var(--color-border)" }}>
          {t("refresh")}
        </button>
      </div>

      {banner && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold ${banner.type === "success" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
          {banner.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
        {TASKS.map((tab) => {
          const active = tab.id === task;
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {task === "timetable" && (
            <>
              <div className="lg:col-span-2 space-y-6">
                <div className={surfaceCls} style={surfaceStyle}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {t("teacherClassesHeading")}
                  </h3>
                  {assignments.length === 0 ? (
                    <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">{t("teacherClassesEmpty")}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {assignments.map((as: any) => (
                        <div key={as.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                          <h4 className="font-bold text-lg">{as.subject_name || as.subject}</h4>
                          <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                            {t("sectionLabel")} {as.section_name || as.section} | {t("schoolLabel")} {as.school_name || as.school}
                          </p>
                          <Link
                            href={`/${locale}/teacher/attendance`}
                            onClick={() => setSelectedSection(as.section)}
                            className="mt-3 inline-block px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)]"
                          >
                            {t("recordForSection")}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("teacherTimetableHeading")}
                </h3>
                {timetable.length === 0 ? (
                  <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">{t("timetableEmpty")}</p>
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
            </>
          )}

          {task === "attendance" && (
            <div className="lg:col-span-2 mx-auto w-full max-w-xl">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("quickAttHeading")}
                </h3>
                <form onSubmit={recordAttendance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("selectSection")}</label>
                    <SelectDropdown
                      value={selectedSection || ""}
                      onChange={(v) => setSelectedSection(Number(v))}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <option value="">{t("selectSectionPlaceholder")}</option>
                      {assignments.map((as: any) => (
                        <option key={as.section} value={as.section}>{as.section_name || `#${as.section}`}</option>
                      ))}
                    </SelectDropdown>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("studentIdLabel")}</label>
                    <input
                      type="number"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder={t("studentIdPlaceholder")}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("colStatus")}</label>
                    <SelectDropdown
                      value={attStatus}
                      onChange={(v) => setAttStatus(String(v))}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <option value="present">{t("statusPresent")}</option>
                      <option value="absent">{t("statusAbsent")}</option>
                      <option value="late">{t("statusLate")}</option>
                    </SelectDropdown>
                  </div>
                  <button type="submit" className="w-full py-3 rounded-2xl font-bold text-white bg-[var(--color-secondary)] shadow-lg hover:opacity-90">
                    {t("saveNotify")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {task === "tickets" && (
            <div className="lg:col-span-3">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("ticketsHeading")}
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("ticketsEmptyTeacher")}</p>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import SelectDropdown from "@/components/ui/SelectDropdown";
import MyClassWorkspace from "@/components/school/MyClassWorkspace";
import { surfaceCls, surfaceStyle } from "@/components/school/admin/adminUi";
import { useToast } from "@/store/toast";

interface TeacherWorkspaceProps {
  task: "timetable" | "attendance" | "tickets" | "my-class" | "grades" | "assignments";
}

const TASKS = [
  { id: "overview", href: "/teacher", labelKey: "navOverview" },
  { id: "timetable", href: "/teacher/timetable", labelKey: "navTimetable" },
  { id: "attendance", href: "/teacher/attendance", labelKey: "navAttendance" },
  { id: "grades", href: "/teacher/grades", labelKey: "navGrades" },
  { id: "assignments", href: "/teacher/assignments", labelKey: "navAssignments" },
  { id: "my-class", href: "/teacher/my-class", labelKey: "navMyClass" },
  { id: "tickets", href: "/teacher/tickets", labelKey: "navTickets" },
] as const;

export default function TeacherWorkspace({ task }: TeacherWorkspaceProps) {
  const locale = useLocale();
  const t = useTranslations("school");
  const { user } = useAuthStore();
  const { success, error } = useToast();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [gradeCategories, setGradeCategories] = useState<any[]>([]);
  const [gradeEntries, setGradeEntries] = useState<any[]>([]);
  const [hwAssignments, setHwAssignments] = useState<any[]>([]);
  const [hwSubmissions, setHwSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Roster attendance state
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [rosterStudents, setRosterStudents] = useState<any[]>([]);
  const [rosterStatuses, setRosterStatuses] = useState<Record<number, string>>({});
  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [recordingAtt, setRecordingAtt] = useState(false);

  // Ticket creation state
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Grading submission state
  const [gradingSubId, setGradingSubId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [grading, setGrading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assRes, slotRes, tickRes, catRes, entRes, hwRes, subRes] = await Promise.all([
        api.get("/schools/teacher-assignments/").catch(() => ({ data: [] })),
        api.get("/schools/timetable-slots/").catch(() => ({ data: [] })),
        api.get("/schools/tickets/").catch(() => ({ data: [] })),
        api.get("/schools/grade-categories/").catch(() => ({ data: [] })),
        api.get("/schools/grade-entries/").catch(() => ({ data: [] })),
        api.get("/schools/assignments/").catch(() => ({ data: [] })),
        api.get("/schools/assignment-submissions/").catch(() => ({ data: [] })),
      ]);
      setAssignments(Array.isArray(assRes.data) ? assRes.data : assRes.data.results || []);
      setTimetable(Array.isArray(slotRes.data) ? slotRes.data : slotRes.data.results || []);
      setTickets(Array.isArray(tickRes.data) ? tickRes.data : tickRes.data.results || []);
      setGradeCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
      setGradeEntries(Array.isArray(entRes.data) ? entRes.data : entRes.data.results || []);
      setHwAssignments(Array.isArray(hwRes.data) ? hwRes.data : hwRes.data.results || []);
      setHwSubmissions(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || []);
    } catch {
      error(t("loading") + " error");
    } finally {
      setLoading(false);
    }
  }, [error, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch roster when selectedSection changes
  useEffect(() => {
    if (!selectedSection) {
      setRosterStudents([]);
      setRosterStatuses({});
      return;
    }
    api
      .get("/schools/enrollments/", { params: { section: selectedSection, locale } })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setRosterStudents(list);
        const initial: Record<number, string> = {};
        list.forEach((st: any) => {
          initial[st.student || st.id] = "present";
        });
        setRosterStatuses(initial);
      })
      .catch(() => {
        setRosterStudents([]);
        setRosterStatuses({});
      });
  }, [selectedSection, locale]);

  const recordBulkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || rosterStudents.length === 0) return;
    setRecordingAtt(true);
    try {
      const records = rosterStudents.map((st: any) => ({
        student_id: Number(st.student || st.id),
        status: rosterStatuses[st.student || st.id] || "present",
      }));
      await api.post("/schools/attendances/bulk_record/", {
        section_id: Number(selectedSection),
        date: attDate,
        records,
      });
      success(t("attendanceSaved"));
    } catch {
      error(t("attendanceSaveError"));
    } finally {
      setRecordingAtt(false);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketMessage.trim()) return;
    setCreatingTicket(true);
    try {
      await api.post("/schools/tickets/", {
        title: ticketTitle.trim(),
        message: ticketMessage.trim(),
      });
      success(t("messageSent"));
      setTicketTitle("");
      setTicketMessage("");
      fetchData();
    } catch {
      error(t("errors.unknown"));
    } finally {
      setCreatingTicket(false);
    }
  };

  const gradeSubmission = async (subId: number) => {
    if (gradeScore === "") return;
    setGrading(true);
    try {
      await api.post(`/schools/assignment-submissions/${subId}/grade/`, {
        score: Number(gradeScore),
        feedback: gradeFeedback,
      });
      success(t("bannerAttUpdated"));
      setGradingSubId(null);
      setGradeScore("");
      setGradeFeedback("");
      fetchData();
    } catch {
      error(t("errors.unknown"));
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div className="min-w-0">
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
            <div className="lg:col-span-3 space-y-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("quickAttHeading")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                        <option key={as.section} value={as.section}>
                          {as.section_name || `#${as.section}`} ({as.subject_name || as.subject})
                        </option>
                      ))}
                    </SelectDropdown>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("colDate")}</label>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                </div>

                {selectedSection && (
                  <div>
                    {rosterStudents.length === 0 ? (
                      <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">{t("studentsEmpty")}</p>
                    ) : (
                      <form onSubmit={recordBulkAttendance} className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-start border-collapse text-sm">
                            <thead>
                              <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                                <th className="p-3 text-start">{t("colStudent")}</th>
                                <th className="p-3 text-start">{t("nationalIdLabel")}</th>
                                <th className="p-3 text-start">{t("colStatus")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rosterStudents.map((st: any) => {
                                const stId = st.student || st.id;
                                return (
                                  <tr key={stId} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                                    <td className="p-3 font-bold">{st.student_name || st.student_email || st.name}</td>
                                    <td className="p-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                      <span dir="ltr">{st.national_id || "—"}</span>
                                    </td>
                                    <td className="p-3">
                                      <SelectDropdown
                                        value={rosterStatuses[stId] || "present"}
                                        onChange={(v) => setRosterStatuses((prev) => ({ ...prev, [stId]: String(v) }))}
                                        className="px-3 py-1.5 rounded-xl border text-xs bg-[var(--color-background)]"
                                        style={{ borderColor: "var(--color-border)" }}
                                      >
                                        <option value="present">{t("statusPresent")}</option>
                                        <option value="absent">{t("statusAbsent")}</option>
                                        <option value="late">{t("statusLate")}</option>
                                      </SelectDropdown>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={recordingAtt}
                            className="px-6 py-3 rounded-2xl font-bold text-white bg-[var(--color-secondary)] shadow-lg hover:opacity-90 disabled:opacity-50"
                          >
                            {recordingAtt ? t("loading") : t("saveAttendance")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {task === "my-class" && (
            <div className="lg:col-span-3">
              <MyClassWorkspace />
            </div>
          )}

          {task === "tickets" && (
            <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-2 ${surfaceCls}`} style={surfaceStyle}>
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

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("newTicket")}
                </h3>
                <form onSubmit={createTicket} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("ticketTitle")}</label>
                    <input
                      type="text"
                      value={ticketTitle}
                      onChange={(e) => setTicketTitle(e.target.value)}
                      placeholder={t("annTitlePlaceholder")}
                      required
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("content")}</label>
                    <textarea
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      placeholder={t("messagePlaceholder")}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingTicket}
                    className="w-full py-3 rounded-2xl font-bold text-white bg-[var(--color-primary)] shadow-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {creatingTicket ? t("loading") : t("sendMessage")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {task === "grades" && (
            <div className="lg:col-span-3">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("gradesHeading")}
                </h3>
                {gradeEntries.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("gradesEmpty")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                          <th className="p-3 text-start">{t("colStudent")}</th>
                          <th className="p-3 text-start">{t("colCategory")}</th>
                          <th className="p-3 text-start">{t("colScore")}</th>
                          <th className="p-3 text-start">{t("colPercentage")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gradeEntries.map((g: any) => (
                          <tr key={g.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                            <td className="p-3 font-bold">{g.student_name || g.student_email}</td>
                            <td className="p-3">{g.category_name}</td>
                            <td className="p-3">{g.score}/{g.category_max_score}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${g.percentage >= 50 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                                {g.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {task === "assignments" && (
            <div className="lg:col-span-3 space-y-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("assignmentsHeading")}
                </h3>
                {hwAssignments.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("assignmentsEmpty")}</p>
                ) : (
                  <div className="space-y-4">
                    {hwAssignments.map((a: any) => {
                      const subs = hwSubmissions.filter((s: any) => s.assignment === a.id);
                      return (
                        <div key={a.id} className="p-4 rounded-2xl bg-[var(--color-background)] border space-y-3" style={{ borderColor: "var(--color-border)" }}>
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-bold text-base">{a.title}</h4>
                              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                {a.subject_name} | {a.section_name} | {t("colDueDate")}: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}
                              </p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-600">
                              {t("submissionsCount")}: {subs.length}
                            </span>
                          </div>

                          {subs.length > 0 && (
                            <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                              <p className="text-xs font-bold mb-2">{t("submissionsCount")}:</p>
                              <div className="space-y-2">
                                {subs.map((sub: any) => (
                                  <div key={sub.id} className="p-3 rounded-xl bg-[var(--color-surface)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2" style={{ borderColor: "var(--color-border)" }}>
                                    <div>
                                      <p className="font-bold text-xs">{sub.student_name || sub.student_email}</p>
                                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                        {t("colNotes")}: {sub.notes || "—"} {sub.score !== null ? `| Score: ${sub.score}/${a.max_score || 100}` : ""}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${sub.status === "graded" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                                        {sub.status_display || sub.status}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setGradingSubId(sub.id);
                                          setGradeScore(sub.score !== null ? String(sub.score) : "");
                                          setGradeFeedback(sub.feedback || "");
                                        }}
                                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[var(--color-primary)]"
                                      >
                                        {t("colScore")}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {gradingSubId !== null && (
                <div className={surfaceCls} style={surfaceStyle}>
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                    {t("colScore")} / Grade Submission
                  </h3>
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="block text-xs font-bold mb-1">{t("colScore")}</label>
                      <input
                        type="number"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        placeholder="Score out of max"
                        className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1">{t("colNotes")}</label>
                      <textarea
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        placeholder="Feedback for student..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => gradeSubmission(gradingSubId)}
                        disabled={grading}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:opacity-90 disabled:opacity-50"
                      >
                        {grading ? t("loading") : t("save")}
                      </button>
                      <button
                        onClick={() => setGradingSubId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold border hover:opacity-80"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

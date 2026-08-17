"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

interface ParentWorkspaceProps {
  task: "children" | "attendance" | "reports" | "grades" | "assignments";
}

const TASKS = [
  { id: "overview", href: "/parent", labelKey: "navOverview" },
  { id: "children", href: "/parent/children", labelKey: "navChildren" },
  { id: "attendance", href: "/parent/attendance", labelKey: "navAttendance" },
  { id: "grades", href: "/parent/grades", labelKey: "navGrades" },
  { id: "assignments", href: "/parent/assignments", labelKey: "navAssignments" },
  { id: "reports", href: "/parent/reports", labelKey: "navReports" },
] as const;

export default function ParentWorkspace({ task }: ParentWorkspaceProps) {
  const locale = useLocale();
  const t = useTranslations("school");
  const { user } = useAuthStore();

  const [familyLinks, setFamilyLinks] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [gradeEntries, setGradeEntries] = useState<any[]>([]);
  const [hwAssignments, setHwAssignments] = useState<any[]>([]);
  const [hwSubmissions, setHwSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [famRes, attRes, repRes, annRes, tickRes, entRes, hwRes, subRes] = await Promise.all([
        api.get("/schools/family-links/").catch(() => ({ data: [] })),
        api.get("/schools/attendances/").catch(() => ({ data: [] })),
        api.get("/schools/weekly-summary/").catch(() => ({ data: [] })),
        api.get("/schools/announcements/").catch(() => ({ data: [] })),
        api.get("/schools/tickets/").catch(() => ({ data: [] })),
        api.get("/schools/grade-entries/").catch(() => ({ data: [] })),
        api.get("/schools/assignments/").catch(() => ({ data: [] })),
        api.get("/schools/assignment-submissions/").catch(() => ({ data: [] })),
      ]);
      setFamilyLinks(Array.isArray(famRes.data) ? famRes.data : famRes.data.results || []);
      setAttendances(Array.isArray(attRes.data) ? attRes.data : attRes.data.results || []);
      setWeeklyReports(Array.isArray(repRes.data) ? repRes.data : repRes.data.results || []);
      setAnnouncements(Array.isArray(annRes.data) ? annRes.data : annRes.data.results || []);
      setTickets(Array.isArray(tickRes.data) ? tickRes.data : tickRes.data.results || []);
      setGradeEntries(Array.isArray(entRes.data) ? entRes.data : entRes.data.results || []);
      setHwAssignments(Array.isArray(hwRes.data) ? hwRes.data : hwRes.data.results || []);
      setHwSubmissions(Array.isArray(subRes.data) ? subRes.data : subRes.data.results || []);
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

  const statusLabel = (status: string) =>
    status === "present" ? t("statusPresent") : status === "absent" ? t("statusAbsent") : status === "late" ? t("statusLate") : status;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
      <div className="flex justify-between items-center mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white inline-block mb-2">
            {t("parentBadge")}
          </span>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {user?.name_ar || user?.email}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {t("parentSubtitle")}
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
          {task === "children" && (
            <>
              <div className="lg:col-span-2 space-y-6">
                <div className={surfaceCls} style={surfaceStyle}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                    {t("childrenHeading")}
                  </h3>
                  {familyLinks.length === 0 ? (
                    <p className="text-sm py-6 text-center text-[var(--color-text-secondary)]">{t("childrenEmpty")}</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {familyLinks.map((f: any) => (
                        <div key={f.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                          <h4 className="font-bold text-lg">{f.student_name || f.student}</h4>
                          <p className="text-xs mt-1 text-[var(--color-text-secondary)]">
                            {t("relationLabel")} {f.relationship || t("relationDefault")} | {t("schoolLabel")} {f.school_name || f.school}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("announcementsHeading")}
                </h3>
                {announcements.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">{t("announcementsEmpty")}</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.slice(0, 5).map((ann: any) => (
                      <div key={ann.id} className="p-3 rounded-xl bg-[var(--color-background)] border text-xs" style={{ borderColor: "var(--color-border)" }}>
                        <p className="font-bold text-sm">{ann.title}</p>
                        <p className="text-[var(--color-text-secondary)] mt-1">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {task === "attendance" && (
            <div className="lg:col-span-3">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("attendanceRecent")}
                </h3>
                {attendances.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("attendanceEmpty")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                          <th className="p-3 text-start">{t("colStudent")}</th>
                          <th className="p-3 text-start">{t("colDate")}</th>
                          <th className="p-3 text-start">{t("colStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendances.map((att: any) => (
                          <tr key={att.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                            <td className="p-3 font-bold">{att.student_name || att.student}</td>
                            <td className="p-3">{att.date}</td>
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${att.status === "present" ? "bg-emerald-500/10 text-emerald-600" : att.status === "absent" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>
                                {statusLabel(att.status)}
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

          {task === "reports" && (
            <div className="lg:col-span-3 space-y-6">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("reportsHeading")}
                </h3>
                {weeklyReports.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("reportsEmpty")}</p>
                ) : (
                  <div className="space-y-3">
                    {weeklyReports.map((r: any) => (
                      <div key={r.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                        <h4 className="font-bold">{r.student_name || r.student}</h4>
                        <p className="text-xs mt-1 text-[var(--color-text-secondary)]">{r.week_start} → {r.week_end}</p>
                        <p className="text-sm mt-2">{r.summary || r.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("ticketsCommHeading")}
                </h3>
                {tickets.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">{t("ticketsEmpty")}</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((tick: any) => (
                      <div key={tick.id} className="p-3 rounded-xl bg-[var(--color-background)] border text-xs" style={{ borderColor: "var(--color-border)" }}>
                        <p className="font-bold">{tick.subject || tick.title}</p>
                        <p className="text-[var(--color-text-secondary)] mt-1">{tick.message}</p>
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="lg:col-span-3">
              <div className={surfaceCls} style={surfaceStyle}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
                  {t("assignmentsHeading")}
                </h3>
                {hwAssignments.length === 0 ? (
                  <p className="text-sm py-8 text-center text-[var(--color-text-secondary)]">{t("assignmentsEmpty")}</p>
                ) : (
                  <div className="space-y-3">
                    {hwAssignments.map((a: any) => (
                      <div key={a.id} className="p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">{a.title}</h4>
                          <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-600">
                            {a.subject_name} | {a.section_name}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                          {t("colDueDate")}: {a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}
                        </p>
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

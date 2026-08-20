"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Directorate {
  id: number;
  name: string;
  name_ar: string;
  name_en: string;
  region: string;
  schools_count: number;
  is_active: boolean;
}

interface DashboardSummary {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  attendance_rate: number;
  average_grades: number;
}

interface SchoolKPI {
  id: number;
  name: string;
  students: number;
  teachers: number;
  attendance_rate: number;
  avg_grades: number;
  status: string;
  school_code?: string;
  manager?: string;
}

interface Alert {
  type: string;
  school: string;
  message: string;
  severity: string;
  date: string;
}

interface ComparisonSchool {
  rank: number;
  name: string;
  attendance_rate: number;
  avg_grades: number;
  score: number;
  status: string;
}

interface TimeSeries {
  labels: string[];
  attendance: number[];
  grades: number[];
  students: number[];
}

const STATUS_COLORS: Record<string, string> = {
  excellent: "#10b981",
  good: "#3b82f6",
  fair: "#f59e0b",
  needs_attention: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  excellent: "ممتاز",
  good: "جيد",
  fair: "مقبول",
  needs_attention: "يحتاج اهتمام",
};

export default function DirectoratesPage() {
  const t = useTranslations("admin.directorates");
  const [directorates, setDirectorates] = useState<Directorate[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<{
    directorate: { id: number; name: string; region: string };
    summary: DashboardSummary;
    schools: SchoolKPI[];
  } | null>(null);
  const [stats, setStats] = useState<TimeSeries | null>(null);
  const [comparison, setComparison] = useState<{
    schools: ComparisonSchool[];
    directorate_average: { attendance_rate: number; average_grades: number };
  } | null>(null);
  const [alerts, setAlerts] = useState<{ alerts: Alert[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "schools" | "comparison" | "alerts">("overview");

  useEffect(() => {
    api.get("/core/directorates/").then((res) => setDirectorates(res.data));
  }, []);

  const loadDashboard = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const [dashRes, statsRes, compRes, alertRes] = await Promise.all([
        api.get(`/core/directorates/${id}/dashboard/`),
        api.get(`/core/directorates/${id}/stats/`),
        api.get(`/core/directorates/${id}/comparison/`),
        api.get(`/core/directorates/${id}/alerts/`),
      ]);
      setDashboard(dashRes.data);
      setStats(statsRes.data);
      setComparison(compRes.data);
      setAlerts(alertRes.data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) loadDashboard(selectedId);
  }, [selectedId, loadDashboard]);

  const s = dashboard?.summary;

  if (!selectedId) {
    return (
      <div className="min-h-screen p-6" style={{ color: "var(--color-text)" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          {t("title")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          {t("subtitle")}
        </p>
        {directorates.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-5xl mb-4">🏛️</p>
            <p className="font-bold">{t("noDirectorates")}</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{t("noDirectoratesHint")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directorates.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="text-start p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🏛️</span>
                  <div>
                    <h3 className="font-bold text-sm">{d.name}</h3>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{d.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                    {d.schools_count} {t("schools")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ color: "var(--color-text)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedId(null); setDashboard(null); }} className="px-3 py-1.5 rounded-xl text-sm font-bold border transition-all hover:scale-105" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>
            ← {t("back")}
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {dashboard?.directorate.name || t("loading")}
            </h1>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {dashboard?.directorate.region}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("loading")}</p>
        </div>
      ) : !s ? null : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: t("totalSchools"), value: s.total_schools, icon: "🏫" },
              { label: t("totalStudents"), value: s.total_students.toLocaleString(), icon: "👨‍🎓" },
              { label: t("totalTeachers"), value: s.total_teachers.toLocaleString(), icon: "👩‍🏫" },
              { label: t("attendanceRate"), value: `${s.attendance_rate}%`, icon: "📊" },
              { label: t("avgGrades"), value: s.average_grades, icon: "📈" },
            ].map((kpi, i) => (
              <div key={i} className="p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <div className="text-2xl mb-2">{kpi.icon}</div>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{kpi.label}</p>
                <p className="text-xl font-bold mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
            {(["overview", "schools", "comparison", "alerts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? "text-white" : ""}`}
                style={activeTab === tab ? { background: "var(--color-primary)" } : { color: "var(--color-text-muted)" }}
              >
                {t(tab)}
                {tab === "alerts" && alerts && alerts.total > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-500 text-white">{alerts.total}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Attendance Chart */}
              <div className="rounded-2xl border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h3 className="font-bold text-sm mb-4">{t("attendanceTrend")}</h3>
                <div className="flex items-end gap-1 h-40">
                  {stats.attendance.slice(-14).map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{val > 0 ? `${val}` : ""}</span>
                      <div
                        className="w-full rounded-t-md transition-all"
                        style={{
                          height: `${Math.max(val * 1.3, 2)}px`,
                          background: val >= 90 ? "#10b981" : val >= 80 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{stats.labels.slice(-14)[i]?.split("/")[1]}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>🟢 ≥90%</span>
                  <span>🟡 80-90%</span>
                  <span>🔴 &lt;80%</span>
                </div>
              </div>

              {/* Grades Chart */}
              <div className="rounded-2xl border p-5" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h3 className="font-bold text-sm mb-4">{t("gradesTrend")}</h3>
                <div className="flex items-end gap-1 h-32">
                  {stats.grades.slice(-14).map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{val > 0 ? `${val}` : ""}</span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(val * 1.2, 2)}px`,
                          background: "var(--color-primary)",
                        }}
                      />
                      <span className="text-[9px]" style={{ color: "var(--color-text-muted)" }}>{stats.labels.slice(-14)[i]?.split("/")[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "schools" && dashboard && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--color-background)" }}>
                    <th className="px-4 py-3 text-start font-bold">#</th>
                    <th className="px-4 py-3 text-start font-bold">{t("schoolName")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("students")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("teachers")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("attendanceRate")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("avgGrades")}</th>
                    <th className="px-4 py-3 text-start font-bold">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.schools.map((sk, i) => (
                    <tr key={sk.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                      <td className="px-4 py-3 font-mono">{i + 1}</td>
                      <td className="px-4 py-3 font-bold">{sk.name}</td>
                      <td className="px-4 py-3">{sk.students}</td>
                      <td className="px-4 py-3">{sk.teachers}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold" style={{ color: sk.attendance_rate >= 90 ? "#10b981" : sk.attendance_rate >= 80 ? "#f59e0b" : "#ef4444" }}>
                          {sk.attendance_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">{sk.avg_grades}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                          style={{ background: STATUS_COLORS[sk.status] || "#6b7280" }}
                        >
                          {STATUS_LABELS[sk.status] || sk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "comparison" && comparison && (
            <div className="space-y-4">
              {/* Directorates Average */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("directorateAvgAttendance")}</p>
                  <p className="text-2xl font-bold mt-1">{comparison.directorate_average.attendance_rate}%</p>
                </div>
                <div className="p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("directorateAvgGrades")}</p>
                  <p className="text-2xl font-bold mt-1">{comparison.directorate_average.average_grades}</p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--color-background)" }}>
                      <th className="px-4 py-3 text-start font-bold">{t("rank")}</th>
                      <th className="px-4 py-3 text-start font-bold">{t("schoolName")}</th>
                      <th className="px-4 py-3 text-start font-bold">{t("attendanceRate")}</th>
                      <th className="px-4 py-3 text-start font-bold">{t("avgGrades")}</th>
                      <th className="px-4 py-3 text-start font-bold">{t("score")}</th>
                      <th className="px-4 py-3 text-start font-bold">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.schools.map((sk) => (
                      <tr key={sk.name} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                        <td className="px-4 py-3 font-bold">
                          {sk.rank <= 3 ? ["🥇", "🥈", "🥉"][sk.rank - 1] : sk.rank}
                        </td>
                        <td className="px-4 py-3 font-bold">{sk.name}</td>
                        <td className="px-4 py-3">{sk.attendance_rate}%</td>
                        <td className="px-4 py-3">{sk.avg_grades}</td>
                        <td className="px-4 py-3 font-bold">{sk.score}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-lg text-xs font-bold text-white"
                            style={{ background: STATUS_COLORS[sk.status] || "#6b7280" }}
                          >
                            {STATUS_LABELS[sk.status] || sk.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "alerts" && alerts && (
            <div className="space-y-3">
              {alerts.alerts.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <p className="text-4xl mb-2">✅</p>
                  <p className="font-bold">{t("noAlerts")}</p>
                </div>
              ) : (
                alerts.alerts.map((alert, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    <div className="text-2xl shrink-0">
                      {alert.severity === "high" ? "🔴" : alert.severity === "medium" ? "🟡" : "🔵"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{alert.school}</h4>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>{alert.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>{alert.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

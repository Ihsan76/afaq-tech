"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  description: string;
  platform_section_id: number | null;
  platform_section_name: string | null;
  last_synced: string | null;
}

interface PlatformSection {
  id: number;
  name: string;
}

interface SyncLog {
  id: number;
  sync_type: string;
  course_id: string;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
}

const SYNC_TYPE_LABELS: Record<string, string> = {
  import_students: "importStudents",
  teacher_send_grades: "sendGrades",
  teacher_sync_assignments: "syncAssignments",
  export_grades: "exportGrades",
  sync_assignments: "syncAssignments",
};

const STATUS_ICONS: Record<string, string> = {
  success: "\u2705",
  partial: "\u26a0\ufe0f",
  failed: "\u274c",
};

export default function TeacherClassroomPage() {
  const t = useTranslations("school.teacherClassroom");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [sections, setSections] = useState<PlatformSection[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "send-grades" | "logs">("courses");
  const [sendCourseId, setSendCourseId] = useState("");
  const [sendSectionId, setSendSectionId] = useState("");
  const [linkingCourseId, setLinkingCourseId] = useState<string | null>(null);
  const [linkSectionId, setLinkSectionId] = useState<number | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const res = await api.get("/core/teacher-classroom/status/");
      setConnected(res.data.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get("/core/teacher-classroom/courses/");
      setConnected(res.data.connected);
      setCourses(res.data.courses || []);
    } catch {
      setCourses([]);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get("/core/google-classroom/sync/logs/");
      setLogs(res.data.logs || []);
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    checkConnection();
    fetchLogs();
    api
      .get("/schools/sections/")
      .then((res) => {
        const data = res.data;
        setSections(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {});
  }, [checkConnection, fetchLogs]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const connectedParam = searchParams.get("connected");
    const errorParam = searchParams.get("error");
    if (connectedParam === "true") {
      setConnected(true);
      setActionResult({ type: "success", message: t("connected") });
      fetchCourses();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (errorParam) {
      setActionResult({ type: "error", message: t("connectError") });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, fetchCourses, t]);

  useEffect(() => {
    if (connected) fetchCourses();
  }, [connected, fetchCourses]);

  const handleConnect = async () => {
    if (connected) return;
    try {
      const res = await api.get("/core/teacher-classroom/auth/");
      if (res.data.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch {
      setActionResult({ type: "error", message: t("connectError") });
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post("/core/teacher-classroom/disconnect/");
      setConnected(false);
      setCourses([]);
      setActionResult({ type: "success", message: t("disconnected") });
    } catch {
      setActionResult({ type: "error", message: t("disconnectError") });
    }
  };

  const handleLinkSection = async (courseId: string, courseName: string) => {
    if (!linkSectionId) return;
    try {
      await api.post("/core/teacher-classroom/link-section/", {
        course_id: courseId,
        course_name: courseName,
        section_id: linkSectionId,
      });
      setActionResult({ type: "success", message: t("sectionLinked") });
      setLinkingCourseId(null);
      fetchCourses();
    } catch {
      setActionResult({ type: "error", message: t("linkError") });
    }
  };

  const handleSyncAssignments = async (courseId: string) => {
    setLoading(true);
    try {
      const res = await api.post("/core/teacher-classroom/sync-assignments/", {
        course_id: courseId,
      });
      setActionResult({
        type: "success",
        message: t("syncSuccess", { count: res.data.assignments?.length || 0 }),
      });
      fetchLogs();
    } catch {
      setActionResult({ type: "error", message: t("syncError") });
    }
    setLoading(false);
  };

  const handleSendGrades = async () => {
    if (!sendCourseId || !sendSectionId) return;
    setLoading(true);
    try {
      const res = await api.post("/core/teacher-classroom/send-grades/", {
        course_id: sendCourseId,
        section_id: sendSectionId,
      });
      setActionResult({
        type: "success",
        message: t("sendGradesSuccess", { count: res.data.exported || 0 }),
      });
      fetchLogs();
    } catch {
      setActionResult({ type: "error", message: t("sendGradesError") });
    }
    setLoading(false);
  };

  return (
    <RoleGuard allowed={["teacher"]}>
      <div className="min-h-screen p-6" style={{ color: "var(--color-text)" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          {t("title")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          {t("subtitle")}
        </p>

        {/* Connection Status */}
        <div
          className="rounded-2xl border p-5 mb-6 flex items-center justify-between"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              {connected === null ? "\u23f3" : connected ? "\U0001f517" : "\u274c"}
            </div>
            <div>
              <p className="font-bold text-sm">
                {connected === null
                  ? t("checking")
                  : connected
                    ? t("connected")
                    : t("notConnected")}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {t("statusDescription")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:scale-105"
                style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
              >
                {t("disconnect")}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: "var(--color-primary)" }}
              >
                {t("connect")}
              </button>
            )}
          </div>
        </div>

        {/* Action Result Toast */}
        {actionResult && (
          <div
            className="rounded-xl p-3 mb-4 text-sm font-bold flex items-center justify-between"
            style={{
              background: actionResult.type === "success" ? "#10b98120" : "#ef444420",
              color: actionResult.type === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${actionResult.type === "success" ? "#10b98140" : "#ef444440"}`,
            }}
          >
            <span>{actionResult.message}</span>
            <button onClick={() => setActionResult(null)} className="text-lg">\u00d7</button>
          </div>
        )}

        {/* Tabs */}
        {connected && (
          <>
            <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
              {(["courses", "send-grades", "logs"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? "text-white" : ""}`}
                  style={activeTab === tab ? { background: "var(--color-primary)" } : { color: "var(--color-text-muted)" }}
                >
                  {t(tab)}
                </button>
              ))}
            </div>

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="space-y-4">
                {courses.length === 0 ? (
                  <div
                    className="text-center py-16 rounded-2xl border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <p className="text-5xl mb-4">\U0001f4da</p>
                    <p className="font-bold">{t("noCourses")}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {t("noCoursesHint")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--color-surface)" }}>
                          <th className="text-left p-3 font-bold">{t("courseName")}</th>
                          <th className="text-left p-3 font-bold">{t("section")}</th>
                          <th className="text-left p-3 font-bold">{t("linkedSection")}</th>
                          <th className="text-left p-3 font-bold">{t("lastSync")}</th>
                          <th className="text-right p-3 font-bold">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr key={course.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                            <td className="p-3 font-bold">{course.name}</td>
                            <td className="p-3" style={{ color: "var(--color-text-secondary)" }}>
                              {course.section || "\u2014"}
                            </td>
                            <td className="p-3">
                              {course.platform_section_name ? (
                                <span
                                  className="px-2 py-1 rounded-lg text-xs font-bold"
                                  style={{ background: "#10b98120", color: "#10b981" }}
                                >
                                  {course.platform_section_name}
                                </span>
                              ) : linkingCourseId === course.id ? (
                                <div className="flex gap-2">
                                  <select
                                    value={linkSectionId || ""}
                                    onChange={(e) => setLinkSectionId(Number(e.target.value) || null)}
                                    className="px-2 py-1 rounded-lg text-xs border"
                                    style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                                  >
                                    <option value="">{t("selectSection")}</option>
                                    {sections.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleLinkSection(course.id, course.name)}
                                    className="px-2 py-1 rounded-lg text-xs font-bold text-white"
                                    style={{ background: "var(--color-primary)" }}
                                  >
                                    {"\u2713"}
                                  </button>
                                  <button
                                    onClick={() => setLinkingCourseId(null)}
                                    className="px-2 py-1 rounded-lg text-xs"
                                    style={{ color: "var(--color-text-muted)" }}
                                  >
                                    {"\u00d7"}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setLinkingCourseId(course.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-bold border"
                                  style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
                                >
                                  {t("linkSection")}
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                              {course.last_synced
                                ? new Date(course.last_synced).toLocaleDateString()
                                : "\u2014"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleSyncAssignments(course.id)}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: "var(--color-primary)" }}
                              >
                                {loading ? t("syncing") : t("syncAssignments")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Send Grades Tab */}
            {activeTab === "send-grades" && (
              <div className="rounded-2xl border p-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <h2 className="font-bold mb-4">{t("sendGradesTitle")}</h2>
                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  {t("sendGradesDescription")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-bold mb-1 block">{t("selectCourse")}</label>
                    <select
                      value={sendCourseId}
                      onChange={(e) => setSendCourseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm border"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
                    >
                      <option value="">{t("selectCourse")}</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold mb-1 block">{t("selectPlatformSection")}</label>
                    <select
                      value={sendSectionId}
                      onChange={(e) => setSendSectionId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-sm border"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
                    >
                      <option value="">{t("selectSection")}</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleSendGrades}
                  disabled={loading || !sendCourseId || !sendSectionId}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  {loading ? t("sending") : t("sendGrades")}
                </button>
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === "logs" && (
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div
                    className="text-center py-16 rounded-2xl border"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <p className="text-5xl mb-4">{"\U0001f4cb"}</p>
                    <p className="font-bold">{t("noLogs")}</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border p-3 flex items-center justify-between"
                      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{STATUS_ICONS[log.status] || "\u2753"}</span>
                        <div>
                          <p className="text-sm font-bold">
                            {t(SYNC_TYPE_LABELS[log.sync_type] || log.sync_type)}
                          </p>
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {JSON.stringify(log.details)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}

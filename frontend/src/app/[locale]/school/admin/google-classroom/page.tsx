"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface ClassroomCourse {
  id: string;
  name: string;
  section: string;
  description: string;
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
  import_teachers: "importTeachers",
  export_grades: "exportGrades",
  sync_assignments: "syncAssignments",
};

const STATUS_ICONS: Record<string, string> = {
  success: "✅",
  partial: "⚠️",
  failed: "❌",
};

export default function GoogleClassroomPage() {
  const t = useTranslations("school.googleClassroom");
  const [connected, setConnected] = useState<boolean | null>(null);
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" | "export" | "logs">("courses");
  const [exportCourseId, setExportCourseId] = useState("");
  const [exportSectionId, setExportSectionId] = useState("");
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);

  const checkConnection = useCallback(async () => {
    try {
      const res = await api.get("/core/google-classroom/status/");
      setConnected(res.data.connected);
    } catch {
      setConnected(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get("/core/google-classroom/courses/");
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

  useEffect(() => {
    api
      .get("/schools/sections/")
      .then((res) => {
        const data = res.data;
        setSections(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    if (connected) return;
    try {
      const res = await api.get("/core/google-classroom/auth/");
      if (res.data.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch {
      setActionResult({ type: "error", message: t("connectError") });
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post("/core/google-classroom/disconnect/");
      setConnected(false);
      setCourses([]);
      setSelectedIds(new Set());
      setActionResult({ type: "success", message: t("disconnected") });
    } catch {
      setActionResult({ type: "error", message: t("disconnectError") });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === courses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(courses.map((c) => c.id)));
    }
  };

  const handleImportStudents = async (courseId?: string) => {
    const ids = courseId ? [courseId] : Array.from(selectedIds);
    if (ids.length === 0) {
      setActionResult({ type: "error", message: t("selectCourseFirst") });
      return;
    }
    setLoading(true);
    let totalImported = 0;
    let totalSkipped = 0;
    let hasError = false;

    for (const id of ids) {
      try {
        const res = await api.post("/core/google-classroom/import/students/", {
          course_id: id,
        });
        totalImported += res.data.imported || 0;
        totalSkipped += res.data.skipped || 0;
      } catch {
        hasError = true;
      }
    }

    setLoading(false);
    setActionResult({
      type: hasError ? "error" : "success",
      message: hasError
        ? t("importPartialError")
        : t("importSuccess", { imported: totalImported, skipped: totalSkipped }),
    });
    fetchLogs();
    setSelectedIds(new Set());
  };

  const handleExportGrades = async () => {
    if (!exportCourseId || !exportSectionId) {
      setActionResult({ type: "error", message: t("selectCourseAndSection") });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/core/google-classroom/export/grades/", {
        course_id: exportCourseId,
        section_id: exportSectionId,
      });
      setActionResult({
        type: "success",
        message: t("exportSuccess", { count: res.data.exported || 0 }),
      });
      fetchLogs();
    } catch {
      setActionResult({ type: "error", message: t("exportError") });
    }
    setLoading(false);
  };

  return (
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
            {connected === null ? "⏳" : connected ? "🔗" : "❌"}
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
          <button onClick={() => setActionResult(null)} className="text-lg">×</button>
        </div>
      )}

      {/* Tabs */}
      {connected && (
        <>
          <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
            {(["courses", "export", "logs"] as const).map((tab) => (
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
                  <p className="text-5xl mb-4">📚</p>
                  <p className="font-bold">{t("noCourses")}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {t("noCoursesHint")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Bulk Actions */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === courses.length && courses.length > 0}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded"
                      />
                      {t("selectAll")} ({selectedIds.size}/{courses.length})
                    </label>
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => handleImportStudents()}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {loading ? t("importing") : t("importSelected", { count: selectedIds.size })}
                      </button>
                    )}
                  </div>

                  {/* Courses Table */}
                  <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--color-background)" }}>
                          <th className="px-4 py-3 w-10"></th>
                          <th className="px-4 py-3 text-start font-bold">{t("courseName")}</th>
                          <th className="px-4 py-3 text-start font-bold">{t("section")}</th>
                          <th className="px-4 py-3 text-start font-bold">{t("description")}</th>
                          <th className="px-4 py-3 text-start font-bold">{t("actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr
                            key={course.id}
                            className="border-t cursor-pointer hover:opacity-80"
                            style={{ borderColor: "var(--color-border)" }}
                            onClick={() => toggleSelect(course.id)}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(course.id)}
                                onChange={() => toggleSelect(course.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 font-bold">{course.name}</td>
                            <td className="px-4 py-3">{course.section || "-"}</td>
                            <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "var(--color-text-secondary)" }}>
                              {course.description || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImportStudents(course.id);
                                }}
                                disabled={loading}
                                className="px-3 py-1 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                                style={{ background: "var(--color-success)" }}
                              >
                                {t("importStudents")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Export Tab */}
          {activeTab === "export" && (
            <div className="rounded-2xl border p-6" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-sm mb-4">{t("exportTitle")}</h3>
              <p className="text-xs mb-6" style={{ color: "var(--color-text-muted)" }}>
                {t("exportDescription")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold mb-2">{t("selectCourse")}</label>
                  <select
                    value={exportCourseId}
                    onChange={(e) => setExportCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    <option value="">{t("chooseCourse")}</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.section ? `(${c.section})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2">{t("selectSection")}</label>
                  <select
                    value={exportSectionId}
                    onChange={(e) => setExportSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    <option value="">{t("chooseSection")}</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleExportGrades}
                disabled={loading || !exportCourseId || !exportSectionId}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {loading ? t("exporting") : t("exportGrades")}
              </button>
            </div>
          )}

          {/* Sync Logs Tab */}
          {activeTab === "logs" && (
            <div>
              {logs.length === 0 ? (
                <div
                  className="text-center py-16 rounded-2xl border"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <p className="text-5xl mb-4">📋</p>
                  <p className="font-bold">{t("noLogs")}</p>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--color-background)" }}>
                        <th className="px-4 py-3 text-start font-bold">{t("date")}</th>
                        <th className="px-4 py-3 text-start font-bold">{t("type")}</th>
                        <th className="px-4 py-3 text-start font-bold">{t("courseId")}</th>
                        <th className="px-4 py-3 text-start font-bold">{t("status")}</th>
                        <th className="px-4 py-3 text-start font-bold">{t("details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                          <td className="px-4 py-3 font-mono text-xs">
                            {new Date(log.created_at).toLocaleDateString("ar-JO", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                              {t(SYNC_TYPE_LABELS[log.sync_type] || log.sync_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{log.course_id}</td>
                          <td className="px-4 py-3">
                            <span>{STATUS_ICONS[log.status] || "❓"} {t(log.status)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

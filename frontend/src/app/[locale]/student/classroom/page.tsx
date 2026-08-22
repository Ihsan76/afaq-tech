"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";

interface StudentCourse {
  id: string;
  name: string;
  section: string;
  teacher: string;
  course_state: string;
}

interface StudentGrade {
  id: string;
  student_name: string;
  assignment_title: string;
  grade: string;
  comment: string;
  submitted_at: string;
}

interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: string;
}

export default function StudentClassroomPage() {
  const t = useTranslations("school.studentClassroom");
  const [activeTab, setActiveTab] = useState<"courses" | "grades" | "assignments">("courses");
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/core/student-classroom/courses/");
      setCourses(res.data.courses || []);
    } catch {
      setError(t("loadError"));
    }
    setLoading(false);
  }, [t]);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/core/student-classroom/grades/");
      setGrades(res.data.grades || []);
    } catch {
      setError(t("loadError"));
    }
    setLoading(false);
  }, [t]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/core/student-classroom/assignments/");
      setAssignments(res.data.assignments || []);
    } catch {
      setError(t("loadError"));
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    if (activeTab === "courses") fetchCourses();
    else if (activeTab === "grades") fetchGrades();
    else if (activeTab === "assignments") fetchAssignments();
  }, [activeTab, fetchCourses, fetchGrades, fetchAssignments]);

  const COURSE_STATE_ICONS: Record<string, string> = {
    ACTIVE: "\U0001f7e2",
    ARCHIVED: "\U0001f536",
  };

  const ASSIGNMENT_STATUS_ICONS: Record<string, string> = {
    TURNED_IN: "\u2705",
    MISSING: "\u274c",
    ASSIGNED: "\U0001f4dd",
  };

  return (
    <RoleGuard allowed={["student"]}>
      <div className="min-h-screen p-6" style={{ color: "var(--color-text)" }}>
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          {t("title")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
          {t("subtitle")}
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b pb-2" style={{ borderColor: "var(--color-border)" }}>
          {(["courses", "grades", "assignments"] as const).map((tab) => (
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

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm font-bold"
            style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444440" }}
          >
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: "var(--color-text-muted)" }}>{t("loading")}</p>
          </div>
        )}

        {/* Courses Tab */}
        {!loading && activeTab === "courses" && (
          <div className="space-y-4">
            {courses.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl border"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-5xl mb-4">{"\U0001f4da"}</p>
                <p className="font-bold">{t("noCourses")}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {t("noCoursesHint")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border p-5 transition-all hover:scale-[1.02]"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{COURSE_STATE_ICONS[course.course_state] || "\U0001f7e2"}</span>
                      <h3 className="font-bold text-sm">{course.name}</h3>
                    </div>
                    {course.section && (
                      <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
                        {course.section}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {t("teacher")}: {course.teacher || "\u2014"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grades Tab */}
        {!loading && activeTab === "grades" && (
          <div className="space-y-2">
            {grades.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl border"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-5xl mb-4">{"\U0001f4ca"}</p>
                <p className="font-bold">{t("noGrades")}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {t("noGradesHint")}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--color-surface)" }}>
                      <th className="text-left p-3 font-bold">{t("assignment")}</th>
                      <th className="text-left p-3 font-bold">{t("grade")}</th>
                      <th className="text-left p-3 font-bold">{t("comment")}</th>
                      <th className="text-left p-3 font-bold">{t("submittedAt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grades.map((g) => (
                      <tr key={g.id} className="border-t" style={{ borderColor: "var(--color-border)" }}>
                        <td className="p-3 font-bold">{g.assignment_title}</td>
                        <td className="p-3 font-bold">
                          <span
                            className="px-2 py-1 rounded-lg text-xs"
                            style={{ background: "#10b98120", color: "#10b981" }}
                          >
                            {g.grade}
                          </span>
                        </td>
                        <td className="p-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                          {g.comment || "\u2014"}
                        </td>
                        <td className="p-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {g.submitted_at ? new Date(g.submitted_at).toLocaleDateString() : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {!loading && activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl border"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <p className="text-5xl mb-4">{"\U0001f4dd"}</p>
                <p className="font-bold">{t("noAssignments")}</p>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                  {t("noAssignmentsHint")}
                </p>
              </div>
            ) : (
              assignments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border p-4 flex items-center justify-between"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{ASSIGNMENT_STATUS_ICONS[a.status] || "\U0001f4dd"}</span>
                    <div>
                      <p className="text-sm font-bold">{a.title}</p>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {a.description || "\u2014"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">
                      {t("status")}: {t(a.status.toLowerCase()) || a.status}
                    </p>
                    {a.due_date && (
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {t("due")}: {new Date(a.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

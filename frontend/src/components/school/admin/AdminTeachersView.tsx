"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  teachers: any[];
  assignments: any[];
  sections: any[];
  years: any[];
  schoolId: string | null;
  refresh: () => void;
}

export default function AdminTeachersView({ teachers, assignments, sections, years, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [assignmentTeacher, setAssignmentTeacher] = useState("");
  const [assignmentSection, setAssignmentSection] = useState("");
  const [assignmentSubject, setAssignmentSubject] = useState("");
  const [assignmentYear, setAssignmentYear] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/academics/subjects/")
      .then((r) => setSubjects(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  const currentYear = years.find((y) => y.is_current)?.id || years[0]?.id;

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail.trim() || !schoolId) return;
    setBusy(true);
    try {
      await api.post("/schools/school-teachers/", {
        school: Number(schoolId),
        teacher_email: teacherEmail.trim(),
        teacher_name: teacherName.trim(),
        password: teacherPassword,
      });
      setTeacherEmail("");
      setTeacherName("");
      setTeacherPassword("");
      setBanner({ type: "success", text: t("bannerTeacherAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerTeacherError") });
    } finally {
      setBusy(false);
    }
  };

  const removeTeacher = async (id: number) => {
    if (!window.confirm(t("confirmDeleteTeacher"))) return;
    try {
      await api.delete(`/schools/school-teachers/${id}/`);
      setBanner({ type: "success", text: t("bannerTeacherDeleted") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerTeacherError") });
    }
  };

  const addAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentTeacher || !assignmentSection || !assignmentSubject || !assignmentYear) return;
    setBusy(true);
    try {
      await api.post("/schools/teacher-assignments/", {
        teacher: Number(assignmentTeacher),
        section: Number(assignmentSection),
        subject: Number(assignmentSubject),
        academic_year: Number(assignmentYear),
      });
      setAssignmentTeacher("");
      setAssignmentSubject("");
      setBanner({ type: "success", text: t("bannerAssignmentAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerAssignmentError") });
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (id: number) => {
    try {
      await api.delete(`/schools/teacher-assignments/${id}/`);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerAssignmentError") });
    }
  };

  const sectionLabel = (sec: any) => {
    const grade = sec.grade_name || sec.grade || "";
    return `${grade} (${sec.name})`;
  };

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";

  return (
    <div className="space-y-6">
      <Banner banner={banner} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={surfaceCls} style={surfaceStyle}>
          <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            {t("teachersAddHeading")}
          </h3>
          <form onSubmit={addTeacher} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1">{t("teacherEmailLabel")}</label>
              <input type="email" value={teacherEmail} onChange={(e) => setTeacherEmail(e.target.value)} required className={inputCls} style={{ borderColor: "var(--color-border)" }} placeholder="teacher@school.com" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("teacherNameLabel")}</label>
              <input type="text" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("teacherPasswordLabel")}</label>
              <input type="text" value={teacherPassword} onChange={(e) => setTeacherPassword(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }} placeholder={t("teacherPasswordPlaceholder")} />
            </div>
            <button type="submit" disabled={busy} className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              {t("teachersAddBtn")}
            </button>
          </form>
        </div>

        <div className={surfaceCls} style={surfaceStyle}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("teachersHeading")}
            </h3>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
              {t("teachersCount", { count: teachers.length })}
            </span>
          </div>
          {teachers.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
              {t("teachersEmpty")}
            </p>
          ) : (
            <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
              {teachers.map((tc: any) => (
                <div key={tc.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex justify-between items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">{tc.teacher_name || tc.teacher_email}</h4>
                    <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                      {tc.teacher_email}
                      {tc.teacher_phone ? ` • ${tc.teacher_phone}` : ""}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                      {t("assignmentsCount", { count: tc.assignment_count || 0 })}
                    </span>
                  </div>
                  <button onClick={() => removeTeacher(tc.id)} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90">
                    {t("reject")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={surfaceCls} style={surfaceStyle}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("assignmentsHeading")}
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("assignmentsCount", { count: assignments.length })}
          </span>
        </div>

        <form onSubmit={addAssignment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <select value={assignmentTeacher} onChange={(e) => setAssignmentTeacher(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
            <option value="">{t("assignTeacherSelect")}</option>
            {teachers.map((tc: any) => (
              <option key={tc.id} value={tc.teacher}>
                {tc.teacher_name || tc.teacher_email}
              </option>
            ))}
          </select>
          <select value={assignmentSection} onChange={(e) => setAssignmentSection(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
            <option value="">{t("assignSectionSelect")}</option>
            {sections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>
                {sectionLabel(sec)}
              </option>
            ))}
          </select>
          <select value={assignmentSubject} onChange={(e) => setAssignmentSubject(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
            <option value="">{t("assignSubjectSelect")}</option>
            {subjects.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <select value={assignmentYear || currentYear || ""} onChange={(e) => setAssignmentYear(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)" }}>
              <option value="">{t("assignYearSelect")}</option>
              {years.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={busy} className="shrink-0 px-5 py-2.5 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              {t("assignAddBtn")}
            </button>
          </div>
        </form>

        {assignments.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("assignmentsEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="p-3 text-start">{t("colTeacher")}</th>
                  <th className="p-3 text-start">{t("colSection")}</th>
                  <th className="p-3 text-start">{t("colSubject")}</th>
                  <th className="p-3 text-start"></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: any) => (
                  <tr key={a.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-3 font-bold">{a.teacher_email}</td>
                    <td className="p-3">{a.section_name}</td>
                    <td className="p-3 text-[var(--color-primary)]">{a.subject_name || a.subject}</td>
                    <td className="p-3 text-end">
                      <button onClick={() => removeAssignment(a.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90">
                        {t("reject")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

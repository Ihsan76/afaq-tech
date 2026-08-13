"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner, downloadBlob } from "@/components/school/admin/adminUi";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface Props {
  sectionId: string;
}

interface AddForm {
  name: string;
  email: string;
  national_id: string;
  parent_email: string;
  phone: string;
}

export default function AdminSectionStudentsView({ sectionId }: Props) {
  const t = useTranslations("school");
  const locale = useLocale();

  const [section, setSection] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<AddForm>({ name: "", email: "", national_id: "", parent_email: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const [conflict, setConflict] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const [transferEn, setTransferEn] = useState<any>(null);
  const [targetSections, setTargetSections] = useState<any[]>([]);
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  const [removing, setRemoving] = useState<number | null>(null);

  const { banner, setBanner } = useBanner();

  const fetchStudents = () => {
    api
      .get("/schools/enrollments/", { params: { section: sectionId, locale } })
      .then((r) => setStudents(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => setStudents([]));
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/schools/sections/${sectionId}/`)
      .then((r) => setSection(r.data))
      .catch(() => {});
    api
      .get("/schools/enrollments/", { params: { section: sectionId, locale } })
      .then((r) => setStudents(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [sectionId, locale]);

  const openTransfer = (en: any) => {
    setTransferEn(en);
    setTargetSectionId("");
    const params: any = {
      school: section?.school,
      academic_year: section?.academic_year,
      grade: section?.grade,
      locale,
    };
    api
      .get("/schools/sections/", { params })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results || [];
        setTargetSections(list.filter((s: any) => s.id !== en.section));
      })
      .catch(() => setTargetSections([]));
  };

  const submitTransfer = async () => {
    if (!transferEn || !targetSectionId) return;
    setTransferring(true);
    try {
      await api.post(`/schools/enrollments/${transferEn.id}/transfer/`, {
        target_section_id: Number(targetSectionId),
      });
      setBanner({ type: "success", text: t("transferSuccess") });
      setTransferEn(null);
      fetchStudents();
    } catch {
      setBanner({ type: "error", text: t("bannerTransferError") });
    } finally {
      setTransferring(false);
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.email.trim() && !form.national_id.trim())) return;
    setAdding(true);
    try {
      const res = await api.post(`/schools/sections/${sectionId}/enroll/`, {
        name: form.name.trim(),
        email: form.email.trim(),
        national_id: form.national_id.trim(),
        parent_email: form.parent_email.trim(),
        phone: form.phone.trim(),
      });
      applyAddResult(res.data);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setConflict(err.response.data);
      } else {
        setBanner({ type: "error", text: t("bannerStudentAddError") });
      }
    } finally {
      setAdding(false);
    }
  };

  const applyAddResult = (data: any) => {
    if (data.school_moved_from) {
      setBanner({ type: "success", text: t("schoolMovedNotice", { school: data.school_moved_from }) });
    } else if (data.moved && data.moved_from) {
      setBanner({ type: "success", text: t("studentMovedNotice", { from: data.moved_from }) });
    } else {
      setBanner({ type: "success", text: t("addStudentSuccess") });
    }
    setForm({ name: "", email: "", national_id: "", parent_email: "", phone: "" });
    fetchStudents();
  };

  const confirmConflict = async () => {
    setConfirming(true);
    try {
      const res = await api.post(`/schools/sections/${sectionId}/enroll/`, {
        name: form.name.trim(),
        email: form.email.trim(),
        national_id: form.national_id.trim(),
        parent_email: form.parent_email.trim(),
        phone: form.phone.trim(),
        confirm: true,
      });
      setConflict(null);
      applyAddResult(res.data);
    } catch {
      setBanner({ type: "error", text: t("bannerStudentAddError") });
    } finally {
      setConfirming(false);
    }
  };

  const removeStudent = async (en: any) => {
    if (!window.confirm(t("confirmRemoveStudent"))) return;
    setRemoving(en.id);
    try {
      await api.delete(`/schools/enrollments/${en.id}/`);
      setBanner({ type: "success", text: t("removeSuccess") });
      fetchStudents();
    } catch {
      setBanner({ type: "error", text: t("bannerRemoveError") });
    } finally {
      setRemoving(null);
    }
  };

  const onImportFile = async (file: File) => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("kind", "students");
      fd.append("section_id", sectionId);
      fd.append("file", file);
      const res = await api.post("/schools/bulk/import/", fd);
      const errors = Array.isArray(res.data.errors) ? res.data.errors : [];
      setBanner({
        type: errors.length > 0 ? "error" : "success",
        text: errors.length > 0
          ? `${t("importResult", { created: res.data.created ?? 0, updated: res.data.updated ?? 0 })}\n${t("importErrorsCount", { count: errors.length })}`
          : t("importResult", { created: res.data.created ?? 0, updated: res.data.updated ?? 0 }),
      });
      fetchStudents();
    } catch {
      setBanner({ type: "error", text: t("bannerImportError") });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const exportStudents = async () => {
    try {
      await downloadBlob(
        "/schools/bulk/export/",
        { kind: "students", section_id: sectionId },
        "afaq_students.xlsx",
      );
    } catch {
      setBanner({ type: "error", text: t("bannerExportError") });
    }
  };

  const downloadTemplate = async () => {
    try {
      await downloadBlob(
        "/schools/bulk/export/",
        { kind: "students", section_id: sectionId, template: 1 },
        "afaq_students_template.xlsx",
      );
    } catch {
      setBanner({ type: "error", text: t("bannerExportError") });
    }
  };

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";
  const actionBtnCls =
    "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/school/admin/sections`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all hover:scale-105 border"
        style={{ borderColor: "var(--color-border)" }}
      >
        → {t("backToSections")}
      </Link>

      <div className={surfaceCls} style={surfaceStyle}>
        <Banner banner={banner} />
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("studentsHeading")} — {section?.name || ""}
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {section?.grade_name ? `${t("gradeLabel")} ${section.grade_name}` : ""}
              {section?.class_teacher_name ? ` • ${t("classTeacherLabel")} ${section.class_teacher_name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`${actionBtnCls} px-4 py-2 rounded-xl`}
              style={{ borderColor: "var(--color-border)" }}
            >
              {importing ? t("loading") : t("importBtn")}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className={`${actionBtnCls} px-4 py-2 rounded-xl`}
              style={{ borderColor: "var(--color-border)" }}
            >
              {t("downloadTemplate")}
            </button>
            <button
              type="button"
              onClick={exportStudents}
              className={`${actionBtnCls} px-4 py-2 rounded-xl`}
              style={{ borderColor: "var(--color-border)" }}
            >
              {t("exportBtn")}
            </button>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
              {t("studentsCount", { count: students.length })}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImportFile(file);
            }}
          />
        </div>

        <form onSubmit={submitAdd} className="mb-8 p-4 rounded-2xl bg-[var(--color-background)] border" style={{ borderColor: "var(--color-border)" }}>
          <h4 className="font-bold text-sm mb-3">{t("addStudentHeading")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">{t("studentNameLabel")}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder={t("studentNamePlaceholder")}
                className={inputCls}
                style={{ borderColor: "var(--color-border)" }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("nationalIdLabel")}</label>
              <input
                type="text"
                dir="ltr"
                value={form.national_id}
                onChange={(e) => setForm((f) => ({ ...f, national_id: e.target.value }))}
                placeholder={t("nationalIdPlaceholder")}
                className={inputCls}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("studentEmailLabel")}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={t("studentEmailPlaceholder")}
                className={inputCls}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("parentEmailLabel")}</label>
              <input
                type="email"
                value={form.parent_email}
                onChange={(e) => setForm((f) => ({ ...f, parent_email: e.target.value }))}
                placeholder={t("parentEmailPlaceholder")}
                className={inputCls}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t("studentPhoneLabel")}</label>
              <input
                type="tel"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder={t("studentPhonePlaceholder")}
                className={inputCls}
                style={{ borderColor: "var(--color-border)" }}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
            >
              {adding ? t("loading") : t("addStudentBtn")}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-center py-10 text-sm font-bold animate-pulse" style={{ color: "var(--color-text-secondary)" }}>
            {t("loading")}
          </p>
        ) : students.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("studentsEmpty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="p-3 text-start">{t("colStudent")}</th>
                  <th className="p-3 text-start">{t("nationalIdLabel")}</th>
                  <th className="p-3 text-start">{t("colEmail")}</th>
                  <th className="p-3 text-end">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((en: any) => (
                  <tr key={en.id} className="border-b hover:bg-[var(--color-background)]" style={{ borderColor: "var(--color-border)" }}>
                    <td className="p-3 font-bold">{en.student_name || en.student_email}</td>
                    <td className="p-3" style={{ color: "var(--color-text-secondary)" }}>
                      <span dir="ltr">{en.national_id || "—"}</span>
                    </td>
                    <td className="p-3" style={{ color: "var(--color-text-secondary)" }}>{en.student_email}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openTransfer(en)}
                          className={`${actionBtnCls} text-[var(--color-primary)]`}
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          {t("transferBtn")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeStudent(en)}
                          disabled={removing === en.id}
                          className={`${actionBtnCls} text-rose-600`}
                          style={{ borderColor: "var(--color-border)" }}
                        >
                          {removing === en.id ? t("loading") : t("removeBtn")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {conflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setConflict(null)}>
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold">{t("studentExistsTitle")}</h3>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm space-y-2">
              <p>
                <strong>{t("colStudent")}:</strong> {conflict.student?.name || conflict.student?.email}
              </p>
              <p>
                <strong>{t("schoolLabel")}</strong> {conflict.school?.name}
              </p>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t("studentExistsBody", {
                name: conflict.student?.name || conflict.student?.email,
                school: conflict.school?.name || "",
              })}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConflict(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--color-border)" }}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={confirmConflict}
                disabled={confirming}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                {confirming ? t("loading") : t("confirmEnroll")}
              </button>
            </div>
          </div>
        </div>
      )}

      {transferEn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setTransferEn(null)}>
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold">{t("transferHeading")}</h3>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {t("transferStudentLabel")}: <strong>{transferEn.student_name || transferEn.student_email}</strong>
            </p>
            <div>
              <label className="block text-xs font-bold mb-1">{t("selectTargetSection")}</label>
              <SelectDropdown
                value={targetSectionId}
                onChange={(v) => setTargetSectionId(String(v))}
                className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <option value="">{t("selectTargetSection")}</option>
                {targetSections.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.grade_name || s.grade}
                  </option>
                ))}
              </SelectDropdown>
              {targetSections.length === 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {t("noTargetSections")}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransferEn(null)}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--color-border)" }}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={submitTransfer}
                disabled={transferring || !targetSectionId}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                {transferring ? t("loading") : t("transferSubmit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

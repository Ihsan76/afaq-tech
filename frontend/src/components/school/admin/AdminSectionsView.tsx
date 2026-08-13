"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface Props {
  sections: any[];
  schoolId: string | null;
  refresh: () => void;
}

interface SectionDraft {
  capacity: number;
  class_teacher: number | "";
}

interface TeacherOption {
  id: number;
  name: string;
  email: string;
}

export default function AdminSectionsView({ sections, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const locale = useLocale();
  const router = useRouter();
  const { banner, setBanner } = useBanner();

  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [drafts, setDrafts] = useState<Record<number, SectionDraft>>({});
  const [saving, setSaving] = useState(false);

  const [showPromote, setShowPromote] = useState(false);
  const [years, setYears] = useState<any[]>([]);
  const [targetYearId, setTargetYearId] = useState<string>("");
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteResult, setPromoteResult] = useState<any>(null);

  const openPromote = () => {
    setShowPromote(true);
    setPromoteResult(null);
    setTargetYearId("");
    api
      .get("/schools/academic-years/", { params: { locale } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results || [];
        setYears(list);
      })
      .catch(() => setYears([]));
  };

  const runPromote = async () => {
    if (!schoolId || !targetYearId) return;
    const source = years.find((y) => y.is_current) || years[0];
    if (!source) return;
    setPromoteLoading(true);
    try {
      const res = await api.post(`/schools/academic-years/${source.id}/promote/`, {
        school_id: Number(schoolId),
        target_year_id: Number(targetYearId),
      });
      setPromoteResult(res.data);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerPromoteError") });
    } finally {
      setPromoteLoading(false);
    }
  };

  useEffect(() => {
    if (!schoolId) return;
    api
      .get("/schools/school-teachers/", { params: { school: schoolId, locale } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results || [];
        setTeachers(
          list.map((tch: any) => ({
            id: Number(tch.teacher),
            name: tch.teacher_name || tch.teacher_email,
            email: tch.teacher_email,
          })),
        );
      })
      .catch(() => setTeachers([]));
  }, [schoolId, locale]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(drafts).length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [drafts]);

  const setDraft = (id: number, patch: Partial<SectionDraft>) => {
    setDrafts((prev) => {
      const sec = sections.find((s) => s.id === id);
      const base: SectionDraft = prev[id] || {
        capacity: sec?.capacity ?? 30,
        class_teacher: sec?.class_teacher ?? "",
      };
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const saveAll = async () => {
    const ids = Object.keys(drafts);
    if (ids.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        ids.map((idStr) => {
          const id = Number(idStr);
          const draft = drafts[id];
          return api.patch(`/schools/sections/${id}/`, {
            capacity: Math.max(1, draft.capacity || 1),
            class_teacher: draft.class_teacher === "" ? null : Number(draft.class_teacher),
          });
        }),
      );
      setDrafts({});
      setBanner({ type: "success", text: t("bannerCapacityUpdated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerCapacityError") });
    } finally {
      setSaving(false);
    }
  };

  const revertAll = () => setDrafts({});

  const openSection = (id: number) => {
    if (Object.keys(drafts).length > 0 && !window.confirm(t("navigateWithUnsaved"))) return;
    router.push(`/${locale}/school/admin/sections/${id}`);
  };

  const dirtyCount = Object.keys(drafts).length;
  const dirtyIds = new Set(Object.keys(drafts).map(Number));

  const inputCls = "w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]";
  const stepperCls = "w-8 h-8 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none transition-all hover:scale-105";

  return (
    <div className={surfaceCls} style={surfaceStyle}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          {t("sectionsHeading")}
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openPromote}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("promoteBtn")}
          </button>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("sectionsCount", { count: sections.length })}
          </span>
        </div>
      </div>

      <Banner banner={banner} />

      {dirtyCount > 0 && (
        <div
          className="sticky top-4 z-30 mb-6 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-600">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t("unsavedChanges")} ({dirtyCount})
          </span>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
          <button
            onClick={revertAll}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-50 border"
            style={{ borderColor: "var(--color-border)" }}
          >
            {t("revert")}
          </button>
        </div>
      )}

      {sections.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
          {t("sectionsEmpty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((sec: any) => {
            const draft = drafts[sec.id];
            const dirty = dirtyIds.has(sec.id);
            return (
              <div
                key={sec.id}
                onClick={() => openSection(sec.id)}
                className="p-4 rounded-2xl bg-[var(--color-background)] border transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-lg">{sec.name}</h4>
                  {dirty && (
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                      {t("unsaved")}
                    </span>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {t("gradeLabel")} {sec.grade_name || sec.grade}
                </p>

                <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                  <span>👥</span>
                  {t("studentsCount", { count: sec.students_count || 0 })}
                </div>

                <div
                  className="mt-4 space-y-3 pt-3 border-t"
                  style={{ borderColor: "var(--color-border)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div>
                    <label className="block text-xs font-bold mb-1">{t("capacityLabel")}</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft(sec.id, { capacity: Math.max(1, (draft?.capacity ?? sec.capacity ?? 30) - 1) })}
                        className={stepperCls}
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={draft?.capacity ?? sec.capacity ?? 30}
                        onChange={(e) => setDraft(sec.id, { capacity: Number(e.target.value) })}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-20 text-center px-2 py-2 rounded-xl border text-sm font-extrabold bg-[var(--color-surface)]"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                      <button
                        type="button"
                        onClick={() => setDraft(sec.id, { capacity: (draft?.capacity ?? sec.capacity ?? 30) + 1 })}
                        className={stepperCls}
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">{t("classTeacherLabel")}</label>
                    <SelectDropdown
                      value={draft?.class_teacher ?? sec.class_teacher ?? ""}
                      onChange={(v) => setDraft(sec.id, { class_teacher: v === "" ? "" : Number(v) })}
                      className={inputCls}
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <option value="">{t("noClassTeacher")}</option>
                      {teachers.map((tch) => (
                        <option key={tch.id} value={tch.id}>
                          {tch.name}
                        </option>
                      ))}
                    </SelectDropdown>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-center text-xs font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}>
                  {t("viewStudents")} ←
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPromote && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowPromote(false)}
        >
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl my-auto">
            <div>
              <h3 className="text-lg font-bold">{t("promoteTitle")}</h3>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                {t("promoteDesc")}
              </p>
            </div>

            {promoteResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl text-sm font-bold bg-emerald-500/10 text-emerald-600">
                  ✅ {t("promoteSuccess")}: {promoteResult.source_year} → {promoteResult.target_year}
                </div>
                <div className="text-sm space-y-1" style={{ color: "var(--color-text-secondary)" }}>
                  <div>
                    {t("promotedStudents")}: <strong className="font-bold">{promoteResult.promoted.length}</strong>
                  </div>
                  <div>
                    {t("skippedStudents")}: <strong className="font-bold">{promoteResult.skipped.length}</strong>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPromote(false)}
                    className="px-5 py-2.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-1">{t("selectTargetYear")}</label>
                  <SelectDropdown
                    value={targetYearId}
                    onChange={(v) => setTargetYearId(String(v))}
                    className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">{t("selectTargetYear")}</option>
                    {years
                      .filter((y: any) => y.id !== (years.find((yy: any) => yy.is_current) || years[0])?.id)
                      .map((y: any) => (
                        <option key={y.id} value={y.id}>
                          {y.name} {y.is_current ? `(${t("currentYear")})` : ""}
                        </option>
                      ))}
                  </SelectDropdown>
                  {years.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                      {t("noYears")}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPromote(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold border transition-all hover:opacity-80"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={runPromote}
                    disabled={promoteLoading || !targetYearId || years.length === 0}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    {promoteLoading ? t("loading") : t("promoteRun")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
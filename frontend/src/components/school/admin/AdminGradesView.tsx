"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  offered: any[];
  subjectPeriods: any[];
  schoolId: string | null;
  refresh: () => void;
}

interface Draft {
  section_count: number;
  is_active: boolean;
}

export default function AdminGradesView({ offered, subjectPeriods, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const locale = useLocale();
  const { banner, setBanner } = useBanner();

  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [addGradeId, setAddGradeId] = useState("");
  const [addSectionCount, setAddSectionCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [selectedGradeId, setSelectedGradeId] = useState<number | string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [periodInput, setPeriodInput] = useState(4);

  useEffect(() => {
    if (offered.length > 0 && (!selectedGradeId || !offered.some((g) => String(g.grade) === String(selectedGradeId)))) {
      setSelectedGradeId(offered[0].grade);
    }
  }, [offered, selectedGradeId]);

  const currentOfferedGrade = offered.find((g) => String(g.grade) === String(selectedGradeId)) || offered[0];
  const currentGradeId = currentOfferedGrade?.grade;

  const assignedPeriods = subjectPeriods.filter((p) => p.grade === currentGradeId);
  const assignedSubjectIds = new Set(assignedPeriods.map((p) => String(p.subject)));
  const availableSubjectsForGrade = subjects.filter((sub) => !assignedSubjectIds.has(String(sub.id)));
  const totalPeriods = assignedPeriods.reduce((acc, p) => acc + (p.weekly_periods || 0), 0);

  const addSubjectPeriod = async () => {
    if (!currentGradeId || !selectedSubjectId || !schoolId) return;
    setBusy(true);
    try {
      await api.post("/schools/school-subject-periods/", {
        school: Number(schoolId),
        grade: Number(currentGradeId),
        subject: Number(selectedSubjectId),
        weekly_periods: periodInput,
      });
      setBanner({ type: "success", text: t("bannerSubjectPeriodsUpdated") });
      setSelectedSubjectId("");
      setPeriodInput(4);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    } finally {
      setBusy(false);
    }
  };

  const removeSubjectPeriod = async (id: number) => {
    try {
      await api.delete(`/schools/school-subject-periods/${id}/`);
      setBanner({ type: "success", text: t("bannerSubjectPeriodsUpdated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    }
  };

  const updateSubjectPeriod = async (id: number, weekly_periods: number) => {
    try {
      await api.patch(`/schools/school-subject-periods/${id}/`, { weekly_periods });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    }
  };

  const DEFAULT_SUBJECTS = [
    { id: 1, name: "الرياضيات" },
    { id: 2, name: "العلوم" },
    { id: 3, name: "اللغة العربية" },
    { id: 4, name: "اللغة الإنجليزية" },
    { id: 5, name: "الفيزياء" },
    { id: 6, name: "الكيمياء" },
    { id: 7, name: "التاريخ" },
    { id: 8, name: "الجغرافيا" },
  ];

  useEffect(() => {
    api
      .get("/academics/grades/", { params: { locale } })
      .then((r) => setAllGrades(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});

    api
      .get("/academics/subjects/", { params: { locale } })
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data.results || [];
        setSubjects(list.length > 0 ? list : DEFAULT_SUBJECTS);
      })
      .catch(() => setSubjects(DEFAULT_SUBJECTS));
  }, [locale]);

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

  const offeredIds = new Set(offered.map((g) => String(g.grade)));
  const availableGrades = allGrades.filter((g) => !offeredIds.has(String(g.id)));

  const addGrade = async () => {
    if (!schoolId || !addGradeId) return;
    setBusy(true);
    try {
      await api.post("/schools/school-grades/", {
        school: Number(schoolId),
        grade: Number(addGradeId),
        section_count: addSectionCount,
      });
      setAddGradeId("");
      setAddSectionCount(1);
      setBanner({ type: "success", text: t("bannerGradeAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    } finally {
      setBusy(false);
    }
  };

  const setDraft = (id: number, patch: Partial<Draft>) => {
    setDrafts((prev) => {
      const g = offered.find((o) => o.id === id);
      const base: Draft = prev[id] || {
        section_count: g?.section_count ?? 1,
        is_active: g?.is_active ?? true,
      };
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const revertGrade = (id: number) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveAllGrades = async () => {
    const entries = Object.entries(drafts);
    if (entries.length === 0) return;
    setSavingAll(true);
    try {
      await Promise.all(
        entries.map(([idStr, draft]) => {
          const id = Number(idStr);
          return api.patch(`/schools/school-grades/${id}/`, {
            section_count: draft.section_count,
            is_active: draft.is_active,
          });
        })
      );
      setBanner({ type: "success", text: t("bannerGradeUpdated") });
      setDrafts({});
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    } finally {
      setSavingAll(false);
    }
  };

  const revertAllGrades = () => {
    setDrafts({});
  };

  const removeGrade = async (id: number) => {
    if (!window.confirm(t("confirmDeleteGrade"))) return;
    try {
      await api.delete(`/schools/school-grades/${id}/`);
      setBanner({ type: "success", text: t("bannerGradeDeleted") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    }
  };

  const stepperCls = "w-8 h-8 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none transition-all hover:scale-105";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={`${surfaceCls} lg:col-span-1`} style={surfaceStyle}>
        <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
          {t("gradesAddHeading")}
        </h3>
        <Banner banner={banner} />
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1">{t("gradesSelectLabel")}</label>
            <select
              value={addGradeId}
              onChange={(e) => setAddGradeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border text-sm bg-[var(--color-background)]"
              style={{ borderColor: "var(--color-border)" }}
            >
              <option value="">{t("gradesSelectPlaceholder")}</option>
              {availableGrades.map((g: any) => (
                <option key={g.id} value={g.id}>
                  {g.name || g.level}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">{t("sectionsPerGradeLabel")}</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddSectionCount(Math.max(0, addSectionCount - 1))}
                className={stepperCls}
                style={{ borderColor: "var(--color-border)" }}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                value={addSectionCount}
                onChange={(e) => setAddSectionCount(Math.max(0, parseInt(e.target.value || "0", 10)))}
                className="w-full flex-1 px-3 py-2 rounded-2xl border text-sm text-center bg-[var(--color-background)]"
                style={{ borderColor: "var(--color-border)" }}
              />
              <button
                type="button"
                onClick={() => setAddSectionCount(addSectionCount + 1)}
                className={stepperCls}
                style={{ borderColor: "var(--color-border)" }}
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={addGrade}
            disabled={busy || !addGradeId || !schoolId}
            className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {busy ? t("saving") : t("gradesAddBtn")}
          </button>
          {availableGrades.length === 0 && (
            <p className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>
              {t("gradesAllAdded")}
            </p>
          )}
        </div>
      </div>

      <div className={`${surfaceCls} lg:col-span-2`} style={surfaceStyle}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("gradesHeading")}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {t("adminSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {Object.keys(drafts).length > 0 && (
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--color-background)] border shadow-sm" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={saveAllGrades}
                  disabled={savingAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  {savingAll ? t("saving") : t("saveChanges")}
                </button>
                <button
                  onClick={revertAllGrades}
                  disabled={savingAll}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {t("revert")}
                </button>
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600">
                  {t("unsavedChanges")} ({Object.keys(drafts).length})
                </span>
              </div>
            )}
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
              {t("gradesCount", { count: offered.length })}
            </span>
          </div>
        </div>

        {offered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("gradesEmpty")}
          </p>
        ) : (
          <div className="space-y-3">
            {offered.map((g: any) => {
              const draft = drafts[g.id];
              const sectionCount = draft?.section_count ?? (g.section_count ?? 1);
              const isActive = draft?.is_active ?? !!g.is_active;
              const isDirty =
                sectionCount !== (g.section_count ?? 1) || isActive !== !!g.is_active;
              return (
                <div
                  key={g.id}
                  data-grade-card
                  className={`p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${isDirty ? "ring-2 ring-amber-500/40" : ""}`}
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-lg">{g.grade_name || g.grade}</h4>
                    {isDirty && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                        {t("unsaved")}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {t("sectionsPerGradeLabel")}:
                      </span>
                      <button
                        onClick={() => setDraft(g.id, { section_count: Math.max(0, sectionCount - 1) })}
                        className={stepperCls}
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={sectionCount}
                        onChange={(e) => setDraft(g.id, { section_count: Math.max(0, parseInt(e.target.value || "0", 10)) })}
                        className="w-16 px-2 py-1 rounded-xl border text-sm text-center bg-[var(--color-background)]"
                        style={{ borderColor: "var(--color-border)" }}
                      />
                      <button
                        onClick={() => setDraft(g.id, { section_count: sectionCount + 1 })}
                        className={stepperCls}
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => setDraft(g.id, { is_active: !isActive })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 ${isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10"}`}
                    >
                      {isActive ? t("gradesActive") : t("gradesInactive")}
                    </button>
                    <button
                      onClick={() => removeGrade(g.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90"
                    >
                      {t("reject")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`${surfaceCls} lg:col-span-3 mt-6`} style={surfaceStyle}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {t("subjectPeriodsHeading")}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              {t("subjectPeriodsSubtitle")}
            </p>
          </div>
        </div>

        {offered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
            {t("gradesEmpty")}
          </p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {offered.map((g: any) => {
                const isActive = String(g.grade) === String(selectedGradeId);
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGradeId(g.grade)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${isActive ? "text-white scale-105" : "bg-[var(--color-background)] border hover:opacity-80"}`}
                    style={isActive ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" } : { borderColor: "var(--color-border)" }}
                  >
                    {g.grade_name || g.grade}
                  </button>
                );
              })}
            </div>

            {currentOfferedGrade && (
              <div className="p-5 rounded-2xl bg-[var(--color-background)] border space-y-4" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600">
                      {t("totalPeriodsLabel", { total: totalPeriods })}
                    </span>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                      {assignedPeriods.length} {t("subjectsCount") || "materials"}
                    </span>
                  </div>
                </div>

                {assignedPeriods.length === 0 ? (
                  <p className="text-xs italic py-6 text-center" style={{ color: "var(--color-text-secondary)" }}>
                    {t("noSubjectsAssigned")}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {assignedPeriods.map((p: any) => (
                      <div key={p.id} className="p-3 rounded-xl border bg-[var(--color-surface)] flex justify-between items-center gap-2" style={{ borderColor: "var(--color-border)" }}>
                        <span className="text-xs font-bold truncate">{p.subject_name || p.subject}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            defaultValue={p.weekly_periods}
                            onBlur={(e) => updateSubjectPeriod(p.id, parseInt(e.target.value || "0", 10))}
                            className="w-14 px-2 py-1 rounded-lg border text-xs text-center bg-[var(--color-background)]"
                            style={{ borderColor: "var(--color-border)" }}
                          />
                          <span className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>{t("weeklyPeriodsUnit")}</span>
                          <button
                            onClick={() => removeSubjectPeriod(p.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all ml-1"
                            title={t("reject")}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-2.5 rounded-xl border text-xs bg-[var(--color-background)]"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">{t("selectSubjectPlaceholder")}</option>
                    {availableSubjectsForGrade.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <input
                      type="number"
                      min={1}
                      value={periodInput}
                      onChange={(e) => setPeriodInput(parseInt(e.target.value || "1", 10))}
                      className="w-20 px-2 py-2.5 rounded-xl border text-xs text-center bg-[var(--color-background)]"
                      style={{ borderColor: "var(--color-border)" }}
                      placeholder={t("weeklyPeriodsUnit")}
                    />
                    <button
                      onClick={addSubjectPeriod}
                      disabled={busy || !selectedSubjectId}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                    >
                      {t("addSubjectToGrade")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

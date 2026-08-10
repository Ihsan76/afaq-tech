"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  offered: any[];
  schoolId: string | null;
  refresh: () => void;
}

interface Draft {
  section_count: number;
  is_active: boolean;
}

export default function AdminGradesView({ offered, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const locale = useLocale();
  const { banner, setBanner } = useBanner();

  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [addGradeId, setAddGradeId] = useState("");
  const [addSectionCount, setAddSectionCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/academics/grades/", { params: { locale } })
      .then((r) => setAllGrades(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    setDrafts({});
  }, [offered]);

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

  const saveGrade = async (id: number) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      await api.patch(`/schools/school-grades/${id}/`, {
        section_count: draft.section_count,
        is_active: draft.is_active,
      });
      setBanner({ type: "success", text: t("bannerGradeUpdated") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    } finally {
      setSavingId(null);
    }
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
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {t("gradesHeading")}
          </h3>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--color-background)] border">
            {t("gradesCount", { count: offered.length })}
          </span>
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
              const savingThis = savingId === g.id;
              return (
                <div
                  key={g.id}
                  data-grade-card
                  className="p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col gap-3"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="font-bold text-lg">{g.grade_name || g.grade}</h4>
                    <div className="flex flex-wrap items-center gap-3">
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
                  {isDirty && (
                    <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        onClick={() => saveGrade(g.id)}
                        disabled={savingThis}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                      >
                        {savingThis ? t("saving") : t("save")}
                      </button>
                      <button
                        onClick={() => revertGrade(g.id)}
                        disabled={savingThis}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
                      >
                        {t("revert")}
                      </button>
                      <span className="text-[10px] font-medium ms-auto" style={{ color: "var(--color-text-muted)" }}>
                        {t("unsavedChanges")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

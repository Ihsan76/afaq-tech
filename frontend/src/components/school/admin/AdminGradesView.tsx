"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { surfaceCls, surfaceStyle, useBanner, Banner } from "@/components/school/admin/adminUi";

interface Props {
  offered: any[];
  schoolId: string | null;
  refresh: () => void;
}

export default function AdminGradesView({ offered, schoolId, refresh }: Props) {
  const t = useTranslations("school");
  const { banner, setBanner } = useBanner();

  const [allGrades, setAllGrades] = useState<any[]>([]);
  const [addGradeId, setAddGradeId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get("/academics/grades/")
      .then((r) => setAllGrades(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {});
  }, []);

  const offeredIds = new Set(offered.map((g) => String(g.grade)));
  const availableGrades = allGrades.filter((g) => !offeredIds.has(String(g.id)));

  const addGrade = async () => {
    if (!schoolId || !addGradeId) return;
    setBusy(true);
    try {
      await api.post("/schools/school-grades/", { school: Number(schoolId), grade: Number(addGradeId), section_count: 1 });
      setAddGradeId("");
      setBanner({ type: "success", text: t("bannerGradeAdded") });
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
    } finally {
      setBusy(false);
    }
  };

  const updateGrade = async (id: number, patch: Record<string, any>) => {
    try {
      await api.patch(`/schools/school-grades/${id}/`, patch);
      refresh();
    } catch {
      setBanner({ type: "error", text: t("bannerGradeError") });
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
          <button
            onClick={addGrade}
            disabled={busy || !addGradeId || !schoolId}
            className="w-full py-3 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("gradesAddBtn")}
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
            {offered.map((g: any) => (
              <div key={g.id} className="p-4 rounded-2xl bg-[var(--color-background)] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
                <div>
                  <h4 className="font-bold text-lg">{g.grade_name || g.grade}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {t("sectionsPerGradeLabel")}:
                    </span>
                    <button
                      onClick={() => updateGrade(g.id, { section_count: Math.max(0, (g.section_count || 1) - 1) })}
                      className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      −
                    </button>
                    <span className="text-sm font-extrabold w-8 text-center">{g.section_count ?? 1}</span>
                    <button
                      onClick={() => updateGrade(g.id, { section_count: (g.section_count || 1) + 1 })}
                      className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border text-sm font-bold leading-none"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => updateGrade(g.id, { is_active: !g.is_active })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 ${g.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10"}`}
                  >
                    {g.is_active ? t("gradesActive") : t("gradesInactive")}
                  </button>
                  <button
                    onClick={() => removeGrade(g.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 transition-all hover:opacity-90"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

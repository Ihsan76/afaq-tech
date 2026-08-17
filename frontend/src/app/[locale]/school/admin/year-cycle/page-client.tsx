"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import RoleGuard from "@/components/school/RoleGuard";
import { getActiveSchoolId } from "@/components/school/activeSchool";

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
  start_date: string;
  end_date: string;
}

interface YearStats {
  year: string;
  enrollments_count: number;
  sections_count: number;
  teachers_count: number;
  is_current: boolean;
}

interface PromoteResult {
  dry_run: boolean;
  promoted: { student: string; student_name: string; from_section: string; to_section: string }[];
  skipped: { student: string; student_name: string; reason: string }[];
  sections_created: number;
  teachers_migrated: number;
  source_year: string;
  target_year: string;
}

export default function SchoolYearCycleClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const ar = locale === "ar";

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceYear, setSourceYear] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [sourceStats, setSourceStats] = useState<YearStats | null>(null);
  const [targetStats, setTargetStats] = useState<YearStats | null>(null);
  const [dryRunResult, setDryRunResult] = useState<PromoteResult | null>(null);
  const [actualResult, setActualResult] = useState<PromoteResult | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "done">("select");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPromote, setLoadingPromote] = useState(false);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/schools/academic-years/");
      const list = Array.isArray(res.data) ? res.data : res.data.results || [];
      setYears(list);
      const current = list.find((y: AcademicYear) => y.is_current);
      if (current) setSourceYear(String(current.id));
    } catch {
      setYears([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  useEffect(() => {
    if (!sourceYear) { setSourceStats(null); return; }
    setLoadingStats(true);
    api.get(`/schools/academic-years/stats/?year=${sourceYear}${getActiveSchoolId() ? `&school=${getActiveSchoolId()}` : ""}`)
      .then((r) => setSourceStats(r.data))
      .catch(() => setSourceStats(null))
      .finally(() => setLoadingStats(false));
  }, [sourceYear]);

  useEffect(() => {
    if (!targetYear) { setTargetStats(null); return; }
    api.get(`/schools/academic-years/stats/?year=${targetYear}${getActiveSchoolId() ? `&school=${getActiveSchoolId()}` : ""}`)
      .then((r) => setTargetStats(r.data))
      .catch(() => setTargetStats(null));
  }, [targetYear]);

  const handleDryRun = async () => {
    if (!sourceYear || !targetYear) return;
    setLoadingPromote(true);
    setDryRunResult(null);
    try {
      const res = await api.post(`/schools/academic-years/${sourceYear}/promote/`, {
        target_year_id: parseInt(targetYear),
        school_id: getActiveSchoolId() ? parseInt(getActiveSchoolId()!) : undefined,
        dry_run: true,
      });
      setDryRunResult(res.data);
      setStep("preview");
    } catch (err: any) {
      alert(err?.response?.data?.error || (ar ? "فشل في المعاينة" : "Preview failed"));
    } finally {
      setLoadingPromote(false);
    }
  };

  const handleConfirmPromote = async () => {
    if (!sourceYear || !targetYear) return;
    setLoadingPromote(true);
    setActualResult(null);
    try {
      const res = await api.post(`/schools/academic-years/${sourceYear}/promote/`, {
        target_year_id: parseInt(targetYear),
        school_id: getActiveSchoolId() ? parseInt(getActiveSchoolId()!) : undefined,
        dry_run: false,
      });
      setActualResult(res.data);
      setStep("done");
    } catch (err: any) {
      alert(err?.response?.data?.error || (ar ? "فشل الترفيع" : "Promotion failed"));
    } finally {
      setLoadingPromote(false);
    }
  };

  const surfaceStyle = { background: "var(--color-surface)", borderColor: "var(--color-border)" };

  return (
    <RoleGuard allowed={["school_admin", "admin", "developer"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {ar ? "دورة العام الدراسي" : "Academic Year Cycle"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {ar ? "ترفيع الطلاب والمعلمين من عام دراسي إلى عام آخر" : "Promote students and teachers from one academic year to the next"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-lg font-bold">{ar ? "جاري التحميل..." : "Loading..."}</div>
        ) : (
          <div className="space-y-8">
            {/* Step 1: Select years */}
            <div className="rounded-3xl border shadow-md p-6" style={surfaceStyle}>
              <h2 className="text-xl font-bold mb-5">
                1️⃣ {ar ? "اختيار الأعوام الدراسية" : "Select Academic Years"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold mb-2">📅 {ar ? "العام المصدر (الحالي)" : "Source Year (Current)"}</label>
                  <select
                    value={sourceYear}
                    onChange={(e) => { setSourceYear(e.target.value); setStep("select"); setDryRunResult(null); setActualResult(null); }}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">{ar ? "-- اختر عاماً --" : "-- Select year --"}</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id} style={{ background: "var(--color-surface)" }}>
                        {y.name} {y.is_current ? (ar ? "(الحالي)" : "(Current)") : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2">🎯 {ar ? "العام الهدف (التالي)" : "Target Year (Next)"}</label>
                  <select
                    value={targetYear}
                    onChange={(e) => { setTargetYear(e.target.value); setStep("select"); setDryRunResult(null); setActualResult(null); }}
                    className="w-full p-3 rounded-2xl border bg-transparent"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <option value="">{ar ? "-- اختر عاماً --" : "-- Select year --"}</option>
                    {years.filter((y) => String(y.id) !== sourceYear).map((y) => (
                      <option key={y.id} value={y.id} style={{ background: "var(--color-surface)" }}>
                        {y.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year stats comparison */}
              {(sourceStats || loadingStats) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-2xl border" style={surfaceStyle}>
                    <h4 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      {ar ? "إحصائيات العام المصدر" : "Source Year Stats"}
                    </h4>
                    {loadingStats ? (
                      <div className="animate-pulse text-sm">...</div>
                    ) : sourceStats ? (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-extrabold">{sourceStats.enrollments_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "طالب" : "Students"}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold">{sourceStats.sections_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "شعبة" : "Sections"}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold">{sourceStats.teachers_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "معلم" : "Teachers"}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {targetStats && (
                    <div className="p-4 rounded-2xl border" style={surfaceStyle}>
                      <h4 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-secondary)" }}>
                        {ar ? "إحصائيات العام الهدف" : "Target Year Stats"}
                      </h4>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-2xl font-extrabold">{targetStats.enrollments_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "طالب" : "Students"}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold">{targetStats.sections_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "شعبة" : "Sections"}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold">{targetStats.teachers_count}</div>
                          <div className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>{ar ? "معلم" : "Teachers"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dry-run button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleDryRun}
                  disabled={!sourceYear || !targetYear || loadingPromote}
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  {loadingPromote ? (ar ? "جاري المعالجة..." : "Processing...") : `🔍 ${ar ? "معاينة الترفيع" : "Preview Promotion"}`}
                </button>
              </div>
            </div>

            {/* Step 2: Preview */}
            {step === "preview" && dryRunResult && (
              <div className="rounded-3xl border shadow-md p-6" style={surfaceStyle}>
                <h2 className="text-xl font-bold mb-5">
                  2️⃣ {ar ? "معاينة النتائج" : "Preview Results"}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-bold">
                    {ar ? "معاينة فقط — لا تغييرات" : "Dry Run — No changes"}
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-emerald-600">{dryRunResult.promoted.length}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "طالب سيتم ترفيعهم" : "Students to promote"}</div>
                  </div>
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-blue-600">{dryRunResult.sections_created}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "شعب جديدة" : "New sections"}</div>
                  </div>
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-purple-600">{dryRunResult.teachers_migrated}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "تعيينات معلمين" : "Teacher assignments"}</div>
                  </div>
                </div>

                {dryRunResult.skipped.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl border border-amber-200 bg-amber-50">
                    <h4 className="text-sm font-bold text-amber-800 mb-2">
                      ⚠️ {ar ? "الطلاب الذين لن يتم ترفيعهم" : "Students who will NOT be promoted"}
                    </h4>
                    <ul className="text-xs space-y-1">
                      {dryRunResult.skipped.map((s, i) => (
                        <li key={i}>• {s.student_name || s.student} — {ar ? "السبب:" : "Reason:"} {ar && s.reason === "graduated — no next grade" ? "تخرج — لا يوجد صف أعلى" : s.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {dryRunResult.promoted.length > 0 && (
                  <div className="mb-5 max-h-60 overflow-y-auto rounded-2xl border" style={surfaceStyle}>
                    <table className="w-full text-xs">
                      <thead className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                        <tr>
                          <th className="p-3 text-start">{ar ? "الطالب" : "Student"}</th>
                          <th className="p-3 text-start">{ar ? "من شعبة" : "From Section"}</th>
                          <th className="p-3 text-start">{ar ? "إلى شعبة" : "To Section"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                        {dryRunResult.promoted.slice(0, 50).map((p, i) => (
                          <tr key={i}>
                            <td className="p-3 font-bold">{p.student_name || p.student}</td>
                            <td className="p-3">{p.from_section}</td>
                            <td className="p-3 text-emerald-700 font-bold">{p.to_section}</td>
                          </tr>
                        ))}
                        {dryRunResult.promoted.length > 50 && (
                          <tr><td colSpan={3} className="p-3 text-center" style={{ color: "var(--color-text-secondary)" }}>
                            ... {ar ? "و" : "and"} {dryRunResult.promoted.length - 50} {ar ? "طالب آخرين" : "more students"}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setStep("select"); setDryRunResult(null); }}
                    className="px-5 py-2.5 rounded-2xl text-sm font-bold border"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    {ar ? "رجوع" : "Back"}
                  </button>
                  <button
                    onClick={handleConfirmPromote}
                    disabled={loadingPromote}
                    className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}
                  >
                    {loadingPromote ? (ar ? "جاري الترفيع..." : "Promoting...") : `✅ ${ar ? "تأكيد الترفيع" : "Confirm Promotion"}`}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === "done" && actualResult && (
              <div className="rounded-3xl border shadow-md p-6" style={surfaceStyle}>
                <h2 className="text-xl font-bold mb-5">
                  3️⃣ {ar ? "تم الترفيع بنجاح" : "Promotion Complete"}
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    ✅ {ar ? "تم" : "Done"}
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-emerald-600">{actualResult.promoted.length}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "طالب مرفّع" : "Students Promoted"}</div>
                  </div>
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-amber-600">{actualResult.skipped.length}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "طالب متخرج" : "Graduated"}</div>
                  </div>
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-blue-600">{actualResult.sections_created}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "شعب جديدة" : "New Sections"}</div>
                  </div>
                  <div className="p-4 rounded-2xl border text-center" style={surfaceStyle}>
                    <div className="text-3xl font-extrabold text-purple-600">{actualResult.teachers_migrated}</div>
                    <div className="text-xs font-bold mt-1">{ar ? "تعيينات معلمين" : "Teacher Assignments"}</div>
                  </div>
                </div>

                <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
                  {ar ? `تم ترقية الطلاب من ${actualResult.source_year} إلى ${actualResult.target_year}.` :
                    `Promoted students from ${actualResult.source_year} to ${actualResult.target_year}.`}
                </p>

                <button
                  onClick={() => { setStep("select"); setActualResult(null); setDryRunResult(null); fetchYears(); }}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold border"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {ar ? "العودة" : "Done"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

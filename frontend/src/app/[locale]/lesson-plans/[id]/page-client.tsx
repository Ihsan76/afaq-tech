"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

interface MainActivityStep {
  step: number;
  title: string;
  description: string;
  duration_minutes?: number;
}

interface StructuredLessonPlanData {
  objectives?: unknown[];
  materials_needed?: unknown[];
  introduction?: unknown;
  main_activity?: MainActivityStep[];
  assessment?: unknown;
  homework?: unknown;
  estimated_duration?: number;
  teaching_methods?: unknown[];
  tags?: unknown[];
  prompt?: unknown;
  raw_response?: string;
  worksheet?: Record<string, unknown>;
  homework_assignment?: Record<string, unknown>;
}

interface LessonPlan {
  id: number;
  title: string;
  subject_name?: string;
  grade_name?: string;
  plan_data: StructuredLessonPlanData;
  generated_by: string;
  ai_model_used: string;
  status: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export default function LessonPlanDetailPage() {
  const t = useTranslations("lessonPlan");
  const tc = useTranslations("common");
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "ar";
  const planId = params.id as string;

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    api
      .get(`/lesson-plans/${planId}/`)
      .then((res) => setPlan(res.data))
      .catch(() => router.push(`/${locale}/lesson-plans`))
      .finally(() => setLoading(false));
  }, [planId, locale, router]);

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const { data } = await api.post(`/lesson-plans/${planId}/duplicate/`);
      router.push(`/${locale}/lesson-plans/${data.id}`);
    } catch {
      setDuplicating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await api.get(`/lesson-plans/${planId}/export-pdf/`, { params: { locale }, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url; a.download = `${plan?.title || "lesson-plan"}-${planId}.pdf`;
      document.body.appendChild(a); a.click();
      a.remove(); window.URL.revokeObjectURL(url);
    } catch {
      alert("فشل تصدير PDF");
    } finally { setExportingPdf(false); }
  };

  const handleCopyText = () => {
    if (!plan) return;
    const text = typeof plan.plan_data === "object" ? JSON.stringify(plan.plan_data, null, 2) : String(plan.plan_data);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الخطة؟")) return;
    try {
      await api.delete(`/lesson-plans/${planId}/delete/`);
      router.push(`/${locale}/lesson-plans`);
    } catch {
      alert("فشل الحذف");
    }
  };

  const handleTogglePublic = async () => {
    try {
      const { data } = await api.post(`/lesson-plans/${planId}/toggle-public/`);
      setPlan((prev) => (prev ? { ...prev, is_public: data.is_public, status: data.status } : prev));
    } catch {
      alert("فشل تغيير حالة المشاركة");
    }
  };

  const handleGenerate = async (type: "worksheet" | "homework") => {
    setGenerating(type);
    try {
      const { data } = await api.post(`/lesson-plans/${planId}/${type}/`);
      setPlan(data);
    } catch {
      alert(`فشل إنشاء ${type === "worksheet" ? "ورقة العمل" : "الواجب المنزلي"}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleRefineSubmit = async () => {
    if (!refinePrompt.trim()) return;
    setRefining(true);
    try {
      const { data } = await api.post(`/lesson-plans/${planId}/refine/`, { prompt: refinePrompt, language: "ar" });
      setPlan(data);
      setRefineOpen(false);
      setRefinePrompt("");
    } catch {
      alert("فشل تعديل الخطة");
    } finally {
      setRefining(false);
    }
  };

  const printSection = (sectionId: string, title: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;

    // Clone to avoid mutating the live DOM
    const clone = el.cloneNode(true) as HTMLElement;

    // Remove answer elements so they don't print
    clone.querySelectorAll(".print-hide-answer").forEach((e) => e.remove());

    const content = clone.innerHTML;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head><title>${title}</title>
      <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: 'Tahoma', 'Segoe UI', sans-serif; padding: 0; line-height: 1.7; color: #1e293b; }
        h2 { color: #4F46E5; font-size: 22px; margin-bottom: 16px; border-bottom: 2px solid #4F46E5; padding-bottom: 6px; }
        h3 { font-size: 16px; margin: 12px 0 6px; color: #334155; }
        .instructions { font-size: 14px; margin-bottom: 20px; color: #475569; }
        .exercise {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 18px;
          padding: 12px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }
        .exercise p { margin: 0 0 6px; font-size: 14px; font-weight: 600; }
        .exercise ul { margin: 4px 0; padding-right: 20px; list-style: none; }
        .exercise ul li {
          font-size: 13px;
          padding: 3px 0;
          color: #475569;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .exercise ul li::before { content: "○ "; color: #4F46E5; margin-left: 4px; }
        .task {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 10px;
          padding: 10px 14px;
          background: #f1f5f9;
          border-radius: 8px;
        }
        .task span { font-weight: 700; }
        .no-print { display: none; }
        .checkbox { margin-left: 6px; }
      </style></head>
      <body>
        <h2>${title}</h2>
        ${content}
      </body></html>
    `);
    printWin.document.close();
    setTimeout(() => printWin.print(), 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{tc("loading")}</span>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  const rawData = plan.plan_data || {};
  const data = (rawData as any).lesson_plan || (rawData as any).plan || rawData;

  // Normalize new schema (metadata, learning_outcomes, materials, lesson_phases) to standard frontend keys if needed
  if (data.learning_outcomes && !data.objectives) {
    data.objectives = data.learning_outcomes;
  }
  if (data.materials && !data.materials_needed) {
    data.materials_needed = data.materials;
  }
  if (data.metadata) {
    if (data.metadata.lesson_title && !data.title) data.title = data.metadata.lesson_title;
    if (data.metadata.description && !data.introduction) data.introduction = data.metadata.description;
  }
  if (data.lesson_phases && !data.main_activity) {
    const phases = data.lesson_phases;
    const steps: any[] = [];
    const phaseKeys = [
      { key: "warm_up", title: "التهيئة والتمهيد (Warm-up)" },
      { key: "exploration", title: "الاستكشاف (Exploration)" },
      { key: "explanation_and_modeling", title: "الشرح والنمذجة (Explanation & Modeling)" },
      { key: "guided_practice", title: "التدريب الموجه (Guided Practice)" },
      { key: "closure_and_assessment", title: "الإغلاق والتقييم (Closure & Assessment)" },
    ];
    let stepNum = 1;
    for (const pk of phaseKeys) {
      if (phases[pk.key]) {
        const pObj = phases[pk.key];
        const desc = Array.isArray(pObj.activities) ? "• " + pObj.activities.join("\n• ") : (pObj.description || String(pObj));
        steps.push({
          step: stepNum++,
          title: pk.title,
          description: desc,
          duration_minutes: pObj.duration ? parseInt(pObj.duration) : undefined,
        });
      }
    }
    if (steps.length > 0) {
      data.main_activity = steps;
    }
  }
  if (data.assessment_tools && !data.assessment) {
    data.assessment = Array.isArray(data.assessment_tools) ? data.assessment_tools.join("\n") : data.assessment_tools;
  }

  const isStructured = data.objectives || data.main_activity || data.introduction || data.procedures || data.lesson_phases || data.metadata;

  const safeText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.map((v) => safeText(v)).filter(Boolean).join("\n");
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (typeof obj.description === "string") return obj.description;
      if (typeof obj.text === "string") return obj.text;
      if (typeof obj.name === "string") return obj.name;
      return JSON.stringify(obj, null, 2);
    }
    return String(value);
  };

  const statusStyle = () => {
    if (plan.status === "draft")
      return { bg: "var(--color-warning-light)", color: "var(--color-warning)", border: "1px solid var(--color-warning)" };
    if (plan.status === "published")
      return { bg: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" };
    return { bg: "var(--color-background-secondary)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" };
  };

  return (
    <div className="min-h-screen print:p-0 print:bg-white" style={{ background: "var(--color-background)" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:max-w-none print:px-0 print:py-0">
        {/* Navigation Bar (hidden in print) */}
        <nav className="flex items-center justify-between mb-6 print:hidden">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <Link href={`/${locale}/lesson-plans`} className="transition-colors hover:underline" style={{ color: "var(--color-primary)" }}>
              {t("title")}
            </Link>
            <span>/</span>
            <span className="font-medium truncate max-w-[200px]" style={{ color: "var(--color-text)" }}>
              {plan.title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              {copied ? "✓ تم النسخ" : "📋 نسخ البيانات"}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
            >
              🖨️ طباعة
            </button>

            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 disabled:opacity-50"
              style={{ borderColor: "var(--color-border)", color: "var(--color-error)" }}
            >
              {exportingPdf ? t("exportingPdf") : `📄 ${t("exportPdf")}`}
            </button>

            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)", border: "1px solid var(--color-success)" }}
            >
              {duplicating ? "جاري النسخ..." : `📋 ${t("copyPlan")}`}
            </button>

            <button
              onClick={() => setRefineOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)", border: "1px solid var(--color-primary)" }}
            >
              🤖 مناقشة مع AI
            </button>

            <button
              onClick={handleTogglePublic}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{ backgroundColor: plan?.is_public ? "var(--color-warning-light)" : "var(--color-muted)", color: plan?.is_public ? "var(--color-warning)" : "var(--color-text)", border: "1px solid var(--color-border)" }}
            >
              {plan?.is_public ? "🔓 إلغاء المشاركة" : "🔒 مشاركة في السوق"}
            </button>

            <button
              onClick={() => handleGenerate("worksheet")}
              disabled={generating === "worksheet"}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            >
              {generating === "worksheet" ? "جاري..." : "📝 ورقة عمل"}
            </button>

            <button
              onClick={() => handleGenerate("homework")}
              disabled={generating === "homework"}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            >
              {generating === "homework" ? "جاري..." : "🏠 واجب منزلي"}
            </button>

            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}
            >
              🗑️ حذف
            </button>
          </div>
        </nav>

        {/* Main Plan Card */}
        <FadeIn direction="up">
          <div
            className="p-6 sm:p-10 rounded-3xl shadow-xl print:shadow-none print:border-none print:p-0 space-y-8"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}
        >
          {/* Header */}
          <div className="border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {plan.title}
              </h1>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={statusStyle()}>
                  {plan.status === "draft" ? t("draft") : plan.status}
                </span>
                {plan.ai_model_used && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-secondary)" }}>
                    🤖 {plan.ai_model_used}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm" style={{ color: "var(--color-text-muted)" }}>
              {plan.subject_name && (
                <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--color-primary)" }}>
                  <span>📚</span>
                  <span>{plan.subject_name}</span>
                </div>
              )}
              {plan.grade_name && (
                <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--color-text)" }}>
                  <span>🎓</span>
                  <span>{plan.grade_name}</span>
                </div>
              )}
              {data.estimated_duration && (
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>المدة المتوقعة: {data.estimated_duration} دقيقة</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>📅</span>
                <span>{new Date(plan.created_at).toLocaleDateString("ar-SA")}</span>
              </div>
            </div>
          </div>

          {/* Structured Content or Raw Prompt */}
          {isStructured ? (
            <div className="space-y-8">
              {/* Objectives */}
              {Boolean(data.objectives?.length) && (
                <div className="rounded-2xl p-5 border" style={{ backgroundColor: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                    <span>🎯</span> الأهداف التعليمية
                  </h2>
                  <ul className="space-y-2">
                    {data.objectives?.map((obj: unknown, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--color-text)" }}>
                        <span className="text-green-600 font-bold shrink-0 mt-0.5">✓</span>
                        <span className="leading-relaxed">{safeText(obj)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials Needed & Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Boolean(data.materials_needed?.length) && (
                  <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                      <span>🛠️</span> الأدوات والوسائل التعليمية
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.materials_needed?.map((mat: unknown, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}>
                          {safeText(mat)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Boolean(data.teaching_methods?.length) && (
                  <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                      <span>💡</span> طرق واستراتيجيات التدريس
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {data.teaching_methods?.map((method: unknown, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                          {safeText(method)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Introduction */}
              {Boolean(data.introduction) && (
                <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-border)" }}>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                    <span>🚀</span> التمهيد والمقدمة
                  </h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                    {safeText(data.introduction)}
                  </p>
                </div>
              )}

              {/* Main Activities (Step by step) */}
              {Boolean(data.main_activity?.length) && (
                <div>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                    <span>📌</span> الأنشطة السير في الدرس (خطوة بخطوة)
                  </h2>
                  <div className="space-y-3">
                    {data.main_activity?.map((step: any, idx: number) => (
                      <div key={idx} className="rounded-2xl p-4 sm:p-5 border relative overflow-hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl text-xs font-bold text-white flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                              {step.step || idx + 1}
                            </span>
                            <h3 className="font-bold text-sm sm:text-base" style={{ color: "var(--color-text)" }}>
                              {step.title}
                            </h3>
                          </div>
                          {step.duration_minutes && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-muted)" }}>
                              ⏱️ {step.duration_minutes} دقائق
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed pr-9 whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment & Homework Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Boolean(data.assessment) && (
                  <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                      <span>📊</span> التقييم والقياس
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                      {safeText(data.assessment)}
                    </p>
                  </div>
                )}

                {Boolean(data.homework) && (
                  <div className="rounded-2xl p-5 border" style={{ borderColor: "var(--color-border)" }}>
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                      <span>🏡</span> الواجب والتطبيق المنزلي
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                      {safeText(data.homework)}
                    </p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {Boolean(data.tags?.length) && (
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>الوسوم:</span>
                  {data.tags?.map((tag: unknown, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg text-xs" style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-muted)" }}>
                      #{safeText(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fallback display for unstructured/raw data */
            <div className="pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
              {data.prompt ? (
                <div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                    {t("description")}
                  </h3>
                  <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--color-text-secondary)" }}>
                    {safeText(data.prompt)}
                  </p>
                </div>
              ) : (
                <pre className="p-4 rounded-2xl text-sm overflow-auto" style={{ backgroundColor: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* AI-Generated Worksheet */}
          {data.worksheet && (() => {
            const ws = data.worksheet as {
              title?: string;
              instructions?: string;
              exercises?: Array<{ question: string; options?: string[]; answer?: string }>;
              sections?: Array<{
                section_title?: string;
                section_instructions?: string;
                questions?: Array<{ question_number?: number; question_text?: string; type?: string; options?: string[]; answer?: string; points?: number }>;
              }>;
              error?: string;
            };
            const renderQuestion = (q: { question_text?: string; question?: string; options?: string[]; answer?: string }, idx: number) => (
              <div key={idx} className="exercise p-3 rounded-xl border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-muted)" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  {idx + 1}. {q.question_text || q.question}
                </p>
                {q.options && Array.isArray(q.options) && (
                  <ul className="space-y-1 pr-4">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{opt}</li>
                    ))}
                  </ul>
                )}
                {q.answer && (
                  <p className="print-hide-answer text-xs mt-1 font-bold" style={{ color: "var(--color-success)" }}>الإجابة: {q.answer}</p>
                )}
              </div>
            );
            return (
            <div className="rounded-2xl p-5 border mt-6" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <span>📝</span> {ws.title || "ورقة العمل"}
                </h2>
                <button
                  onClick={() => printSection("print-worksheet", ws.title || "ورقة العمل")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold print:hidden transition-all border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  🖨️ طباعة
                </button>
              </div>
              <div id="print-worksheet">
                {ws.error && <p className="text-sm text-red-500">{ws.error}</p>}
                {ws.instructions && (
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>{ws.instructions}</p>
                )}
                {ws.sections && Array.isArray(ws.sections) && ws.sections.length > 0 ? (
                  <div className="space-y-4">
                    {ws.sections.map((section, si) => (
                      <div key={si} className="p-3 rounded-xl border" style={{ borderColor: "var(--color-border)" }}>
                        {section.section_title && (
                          <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text)" }}>{section.section_title}</p>
                        )}
                        {section.section_instructions && (
                          <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>{section.section_instructions}</p>
                        )}
                        {section.questions && Array.isArray(section.questions) && (
                          <div className="space-y-2">
                            {section.questions.map((q, qi) => renderQuestion(q, qi))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  ws.exercises && Array.isArray(ws.exercises) && (
                    <div className="space-y-3">
                      {ws.exercises.map((ex, idx) => renderQuestion(ex, idx))}
                    </div>
                  )
                )}
              </div>
            </div>
            );
          })()}

          {/* AI-Generated Homework Assignment */}
          {data.homework_assignment && (() => {
            const hw = data.homework_assignment as { homework_title?: string; instructions?: string; tasks?: Array<{ task_number: number; description: string }>; error?: string };
            return (
            <div className="rounded-2xl p-5 border mt-6" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-text)" }}>
                  <span>🏠</span> {hw.homework_title || "الواجب المنزلي"}
                </h2>
                <button
                  onClick={() => printSection("print-homework", hw.homework_title || "الواجب المنزلي")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold print:hidden transition-all border"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  🖨️ طباعة
                </button>
              </div>
              <div id="print-homework">
                {hw.error && <p className="text-sm text-red-500">{hw.error}</p>}
                {hw.instructions && (
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>{hw.instructions}</p>
                )}
                {hw.tasks && Array.isArray(hw.tasks) && (
                  <div className="space-y-2">
                    {hw.tasks.map((task, idx) => (
                      <div key={idx} className="task flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--color-muted)" }}>
                        <span className="w-6 h-6 rounded-lg text-xs font-bold text-white flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--color-primary)" }}>
                          {task.task_number || idx + 1}
                        </span>
                        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{task.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            );
          })()}
        </div>
      </FadeIn>
      </div>

      {/* Refine / Discuss with AI Modal */}
      {refineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRefineOpen(false)}>
          <div
            className="w-full max-w-lg mx-4 p-6 rounded-3xl shadow-xl"
            style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>🤖 مناقشة الخطة مع AI</h2>
            <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
              اطلب تعديل أي جزء من الخطة وسيتم تطبيق التغييرات مباشرة.
            </p>
            <textarea
              dir="rtl"
              className="w-full p-3 rounded-xl text-sm border resize-none focus:outline-none"
              rows={4}
              placeholder="مثال: أضف نشاطاً تفاعلياً إضافياً في منتصف الدرس"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text)" }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRefineOpen(false); setRefinePrompt(""); }}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-muted)" }}
              >
                إلغاء
              </button>
              <button
                onClick={handleRefineSubmit}
                disabled={refining || !refinePrompt.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {refining ? "جارٍ التعديل..." : "تطبيق التعديل"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

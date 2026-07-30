"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

interface AcademicItem {
  id: number;
  name: string;
}

interface AIModelItem {
  id: number;
  model_id: string;
  name_ar: string;
  name_en: string;
  name?: Record<string, string>;
  provider: string;
  is_default: boolean;
}

export default function NewLessonPlanPage() {
  const t = useTranslations("lessonPlan");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">("");
  const [gradeId, setGradeId] = useState<number | "">("");
  const [selectedModel, setSelectedModel] = useState("");
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  
  const [subjects, setSubjects] = useState<AcademicItem[]>([]);
  const [grades, setGrades] = useState<AcademicItem[]>([]);
  const [models, setModels] = useState<AIModelItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/academics/subjects/?locale=${locale}`)
      .then((res) => setSubjects(res.data.results || res.data || []))
      .catch(() => {});

    api.get(`/academics/grades/?locale=${locale}`)
      .then((res) => setGrades(res.data.results || res.data || []))
      .catch(() => {});

    api.get("/ai/models/")
      .then((res) => {
        const list = res.data.results || res.data || [];
        setModels(list);
        const def = list.find((m: AIModelItem) => m.is_default) || list[0];
        if (def) setSelectedModel(def.model_id);
      })
      .catch(() => {});
  }, [locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("prompt", prompt);
      formData.append("language", locale);
      if (subjectId) formData.append("subject", subjectId.toString());
      if (gradeId) formData.append("grade", gradeId.toString());
      if (selectedModel) formData.append("model_id", selectedModel);
      if (curriculumFile) formData.append("curriculum_file", curriculumFile);

      const { data } = await api.post("/lesson-plans/generate/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push(`/${locale}/lesson-plans/${data.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        tc("error") ||
        "حدث خطأ أثناء توليد خطة الدرس"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/${locale}/lesson-plans`} className="transition-colors hover:underline" style={{ color: "var(--color-primary)" }}>
            {t("title")}
          </Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "var(--color-text)" }}>{t("create")}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            ✨ {t("generate")}
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl mb-6 text-sm flex items-center justify-between gap-2" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="font-bold text-xs">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl shadow-xl space-y-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {t("planTitle")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
              placeholder={t("planTitlePlaceholder")}
              required
              disabled={loading}
            />
          </div>

          {/* Subject & Grade grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("subject")}
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                <option value="">{t("optional")}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("grade")}
              </label>
              <select
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value ? parseInt(e.target.value) : "")}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                <option value="">{t("optional")}</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("aiModel")}
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.model_id}>
                    {m.name?.[locale] || m.name_ar || m.model_id} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

          {/* Optional Curriculum File Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "📁 إرفاق ملف المنهاج أو الكتاب (اختياري)" : "📁 Attach Curriculum File / Textbook (Optional)"}
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={(e) => setCurriculumFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-3 border rounded-2xl file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)] file:text-white hover:file:opacity-90"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
              disabled={loading}
            />
            <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
              {locale === "ar" ? "قم برفع ملف الكتاب أو المنهاج لكي يستمد الذكاء الاصطناعي محتواه وسياقه بدقة تامة." : "Upload textbook or syllabus file so AI can tailor the lesson plan precisely to your curriculum."}
            </p>
          </div>

          {/* Prompt/Description */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {t("lessonDescription")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all resize-none outline-none"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
              placeholder={t("lessonDescPlaceholder")}
              required
              disabled={loading}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !title.trim() || !prompt.trim()}
            className="w-full text-white py-4 rounded-2xl font-bold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{t("generatingAi")}</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>{t("generateButton")}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface AcademicItem {
  id: number;
  name: string;
}

interface UnitItem {
  id: number;
  name: string;
  subject: number | null;
  subject_name: string;
  order: number;
  outcomes: string[];
}

interface BookItem {
  id: number;
  title: string;
  subject: number | null;
  file: string | null;
  external_url: string | null;
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
  const searchParams = useSearchParams();
  const locale = useLocale();

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [subjectId, setSubjectId] = useState<number | "">(searchParams.get("subject") ? parseInt(searchParams.get("subject")!) : "");
  const [gradeId, setGradeId] = useState<number | "">(searchParams.get("grade") ? parseInt(searchParams.get("grade")!) : "");
  const [unitId, setUnitId] = useState<number | "">("");
  const [selectedModel, setSelectedModel] = useState("");
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  
  const [subjects, setSubjects] = useState<AcademicItem[]>([]);
  const [grades, setGrades] = useState<AcademicItem[]>([]);
  const [models, setModels] = useState<AIModelItem[]>([]);
  const [curriculumUnits, setCurriculumUnits] = useState<UnitItem[]>([]);
  const [curriculumBooks, setCurriculumBooks] = useState<BookItem[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [curriculumLabel, setCurriculumLabel] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  
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

  // Fetch official curriculum units when grade + subject are selected
  useEffect(() => {
    setCurriculumUnits([]);
    setCurriculumBooks([]);
    setSelectedBookIds([]);
    setCurriculumLabel("");
    setUnitId("");
    if (!subjectId || !gradeId) return;
    setCurriculumLoading(true);
    api.get(`/academics/curricula/resolve/?grade=${gradeId}&subject=${subjectId}&locale=${locale}`)
      .then((res) => {
        const units = res.data.units || [];
        setCurriculumUnits(units);
        const first = res.data.results?.[0];
        if (first) {
          const name = first.name || "";
          const country = first.country || "";
          setCurriculumLabel(name ? `${name}${country ? " — " + country : ""}` : "");
          const books = (first.documents || []).filter(
            (b: BookItem) => !subjectId || b.subject === subjectId || b.subject === null
          );
          setCurriculumBooks(books);
          if (books.length > 0) setSelectedBookIds([books[0].id]);
        }
      })
      .catch(() => {})
      .finally(() => setCurriculumLoading(false));
  }, [subjectId, gradeId, locale]);

  const toggleBook = (id: number, checked: boolean) => {
    setSelectedBookIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const [isRetrying, setIsRetrying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const executeGeneration = async (attempt = 1) => {
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("prompt", prompt);
      formData.append("language", locale);
      if (subjectId) formData.append("subject", subjectId.toString());
      if (gradeId) formData.append("grade", gradeId.toString());
      if (unitId) formData.append("unit", unitId.toString());
      if (selectedBookIds.length) formData.append("document_ids", selectedBookIds.join(","));
      if (selectedModel) formData.append("model_id", selectedModel);
      if (curriculumFile) formData.append("curriculum_file", curriculumFile);

      const { data } = await api.post("/lesson-plans/generate/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsRetrying(false);
      router.push(`/${locale}/lesson-plans/${data.id}`);
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if ((status === 502 || status === 503) && attempt < 5) {
        const nextAttempt = attempt + 1;
        const waitSeconds = nextAttempt * 5;
        setIsRetrying(true);
        setLoading(false);

        setError(
          locale === "ar"
            ? `⚠️ خطأ في الاتصال (502/503). جاري إعادة المحاولة تلقائياً (محاولة ${nextAttempt}/5) خلال ${waitSeconds} ثانية...`
            : `⚠️ AI service error (502/503). Retrying automatically (Attempt ${nextAttempt}/5) in ${waitSeconds}s...`
        );

        if (timerRef.current) clearInterval(timerRef.current);
        let currentSeconds = waitSeconds;
        timerRef.current = setInterval(() => {
          currentSeconds -= 1;
          if (currentSeconds <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRetrying(false);
            executeGeneration(nextAttempt);
          } else {
            setError(
              locale === "ar"
                ? `⚠️ خطأ في الاتصال (502/503). جاري إعادة المحاولة تلقائياً (محاولة ${nextAttempt}/5) خلال ${currentSeconds} ثانية...`
                : `⚠️ AI service error (502/503). Retrying automatically (Attempt ${nextAttempt}/5) in ${currentSeconds}s...`
            );
          }
        }, 1000);
        return;
      }

      setIsRetrying(false);
      setLoading(false);
      let errorMsg = "";
      if (status === 429) {
        errorMsg = locale === "ar" 
          ? "لقد تم استنفاد الحصة المجانية لمزود الذكاء الاصطناعي (خطأ 429). يرجى التبديل إلى نموذج ذكاء اصطناعي آخر."
          : "AI quota exceeded (429 Too Many Requests). Please switch to another AI model.";
      } else if (status === 502 || status === 503) {
        errorMsg = locale === "ar"
          ? "خطأ في الاتصال بخدمة الذكاء الاصطناعي (502/503). فشلت جميع محاولات إعادة الاتصال التلقائي (5 محاولات). يرجى المحاولة لاحقاً."
          : "AI service gateway error (502/503). All automatic retry attempts (5) failed. Please try again later.";
      } else if (typeof data === "object" && data !== null) {
        errorMsg = data.message || data.error || data.detail;
      } else if (typeof data === "string" && data.length < 200) {
        errorMsg = data;
      }

      setError(
        errorMsg ||
        err.message ||
        (locale === "ar" ? "حدث خطأ أثناء توليد خطة الدرس. يرجى المحاولة مرة أخرى." : "An error occurred while generating the lesson plan. Please try again.")
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRetrying(false);
    executeGeneration(1);
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
              <SelectDropdown
                value={subjectId}
                onChange={(v) => setSubjectId(v ? parseInt(String(v), 10) : "")}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                <option value="">{t("optional")}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectDropdown>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("grade")}
              </label>
              <SelectDropdown
                value={gradeId}
                onChange={(v) => setGradeId(v ? parseInt(String(v), 10) : "")}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                <option value="">{t("optional")}</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </SelectDropdown>
            </div>
          </div>

          {/* Official curriculum unit picker */}
          {(curriculumUnits.length > 0 || curriculumLoading) && (
            <div className="p-4 rounded-2xl" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span>📚</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                    {t("curriculumUnitTitle")}
                  </div>
                  {curriculumLabel && (
                    <div className="text-xs" style={{ color: "var(--color-primary)" }}>{curriculumLabel}</div>
                  )}
                </div>
              </div>

              {curriculumLoading ? (
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <span className="inline-block animate-pulse">⏳</span> {t("loadingUnits")}
                </p>
              ) : (
                <>
                  <SelectDropdown
                    value={unitId}
                    onChange={(v) => setUnitId(v ? parseInt(String(v), 10) : "")}
                    className="w-full px-4 py-3 border rounded-2xl outline-none"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    disabled={loading}
                  >
                    <option value="">{t("allUnits")}</option>
                    {curriculumUnits.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </SelectDropdown>
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    {t("curriculumUnitHint")}
                  </p>
                </>
              )}

              {curriculumBooks.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                  <div className="text-sm font-bold mb-2" style={{ color: "var(--color-text)" }}>
                    {t("curriculumBooksTitle")}
                  </div>
                  <div className="space-y-1.5">
                    {curriculumBooks.map((b) => (
                      <label
                        key={b.id}
                        className="flex items-start gap-2 text-sm cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5"
                        style={{ color: "var(--color-text)" }}
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={selectedBookIds.includes(b.id)}
                          onChange={(e) => toggleBook(b.id, e.target.checked)}
                          disabled={loading}
                        />
                        <span className="leading-snug">{b.title}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                    {t("curriculumBooksHint")}
                  </p>
                </div>
              )}
            </div>
          )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                {t("aiModel")}
              </label>
              <SelectDropdown
                value={selectedModel}
                onChange={(v) => setSelectedModel(String(v))}
                className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all outline-none"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                disabled={loading}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.model_id}>
                    {m.name?.[locale] || m.name_ar || m.model_id} ({m.provider})
                  </option>
                ))}
              </SelectDropdown>
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

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm flex items-center justify-between gap-2" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
              <button onClick={() => setError("")} className="font-bold text-xs">✕</button>
            </div>
          )}

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

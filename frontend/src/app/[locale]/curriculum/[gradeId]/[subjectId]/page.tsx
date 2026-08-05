"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { api, API_URL } from "@/lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function CurriculumSubjectDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const gradeId = params.gradeId as string;
  const subjectId = params.subjectId as string;

  const { data: documents } = useSWR(`/academics/documents/?subject=${subjectId}&grade=${gradeId}`, fetcher);

  return (
    <div className="min-h-screen py-12" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/${locale}/curriculum`} style={{ color: "var(--color-primary)" }}>{locale === "ar" ? "المناهج الدراسية" : "Curriculum"}</Link>
          <span>/</span>
          <Link href={`/${locale}/curriculum/${gradeId}`} style={{ color: "var(--color-primary)" }}>{locale === "ar" ? "المواد" : "Subjects"}</Link>
          <span>/</span>
          <span style={{ color: "var(--color-text)" }}>{locale === "ar" ? "تفاصيل المنهاج والمراجع" : "Curriculum Details"}</span>
        </nav>

        <div className="p-8 rounded-3xl mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "مقرر المنهاج الدراسي والمستندات المعتمدة" : "Official Curriculum Syllabus & Documents"}
          </h1>
          <p className="mb-6 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            {locale === "ar" 
              ? "استعراض الكتب المقررة، المراجع الرسمية، ووثائق المنهاج المرفوعة لتوليد خطط الدروس والأنشطة بدقة بناءً على سياق المنهاج الرسمي المعتمد."
              : "Review textbooks, official references, and uploaded curriculum documents to generate accurate lesson plans."}
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/lesson-plans/new?subject=${subjectId}&grade=${gradeId}`} className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105" style={{ background: "var(--color-primary)" }}>
              {locale === "ar" ? "📝 توليد خطة درس لهذا المنهاج بالذكاء الاصطناعي" : "📝 Generate AI Lesson Plan for this Curriculum"}
            </Link>
          </div>
        </div>

        <div className="p-8 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "مستندات وكتب المنهاج المرفوعة" : "Uploaded Curriculum Documents"}
          </h2>
          {documents?.results && documents.results.length > 0 ? (
            <ul className="space-y-3">
              {documents.results.map((doc: any) => (
                <li key={doc.id} className="p-4 rounded-xl flex flex-col gap-3" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold" style={{ color: "var(--color-text)" }}>{doc.title}</span>
                    <div className="flex gap-2 shrink-0">
                      <a href={doc.external_url || doc.download_url || `${API_URL}/academics/documents/${doc.id}/download/`} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: "var(--color-primary)" }}>
                        {locale === "ar" ? "معاينة" : "Preview"}
                      </a>
                      <a href={doc.external_url || (doc.download_url ? `${doc.download_url}?download=1` : `${API_URL}/academics/documents/${doc.id}/download/?download=1`)} rel="noreferrer" className="text-sm px-4 py-2 rounded-lg font-medium text-white" style={{ background: "var(--color-success)" }}>
                        {locale === "ar" ? "تحميل" : "Download"}
                      </a>
                    </div>
                  </div>
                  {doc.extracted_text ? (
                    <details>
                      <summary className="text-sm cursor-pointer font-medium" style={{ color: "var(--color-primary)" }}>
                        {locale === "ar" ? "👁️ عرض محتوى المنهاج" : "👁️ View Curriculum Content"}
                      </summary>
                      <pre className="mt-3 max-h-96 overflow-auto p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed" style={{ background: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)", direction: "rtl", textAlign: "right" }}>
                        {doc.extracted_text}
                      </pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {locale === "ar" ? "لا توجد مستندات مرفوعة لهذه المادة حتى الآن. يمكنك رفعها من لوحة التحكم (Admin)." : "No documents uploaded for this subject yet. You can upload them from the Admin panel."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";

export default function NewLessonPlanPage() {
  const t = useTranslations("lessonPlan");
  const tc = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data } = await api.post("/lesson-plans/", { title, plan_data: { prompt, type: "ai_generated" }, status: "draft" });
      router.push(`/${locale}/lesson-plans/${data.id}`);
    } catch (err: any) { setError(err.response?.data?.detail || tc("error")); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          <Link href={`/${locale}/lesson-plans`} className="transition-colors" style={{ color: "var(--color-primary)" }}>{t("title")}</Link>
          <span>/</span>
          <span className="font-medium" style={{ color: "var(--color-text)" }}>{t("create")}</span>
        </nav>

        <h2 className="text-3xl font-bold mb-8" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("generate")}</h2>

        {error && (
          <div className="px-4 py-3 rounded-2xl mb-6 text-sm flex items-center gap-2" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)", border: "1px solid var(--color-error)" }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 rounded-3xl shadow-xl space-y-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("planTitle")}</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
              placeholder={t("planTitlePlaceholder")} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("lessonDescription")}</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5}
              className="w-full px-4 py-3.5 border rounded-2xl focus:ring-2 transition-all resize-none"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
              placeholder={t("lessonDescPlaceholder")} required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-white py-3.5 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                {t("generating")}...
              </span>
            ) : t("generate")}
          </button>
        </form>
      </div>
    </div>
  );
}

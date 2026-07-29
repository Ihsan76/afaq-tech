"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

interface Lesson {
  id: number;
  title: Record<string, string>;
  video_url?: string;
  duration_minutes: number;
  order: number;
  is_free_preview: boolean;
}

interface Chapter {
  id: number;
  title: Record<string, string>;
  order: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  thumbnail: string;
  category_name: Record<string, string> | null;
  instructor_name: Record<string, string>;
  instructor_avatar: string;
  instructor_url: string;
  level: string;
  language: string;
  duration_hours: number;
  is_free: boolean;
  price: string;
  lessons_count: number;
  students_count: number;
  chapters: Chapter[];
  is_enrolled: boolean;
  enrollment_progress: number | null;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";
  const slug = params.slug as string;
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const { user } = useAuthStore();
  const [enrolling, setEnrolling] = useState(false);
  const [openChapters, setOpenChapters] = useState<number[]>([0]);

  const { data: course, error, isLoading, mutate } = useSWR<CourseDetail>(`/courses/${slug}/`, fetcher);

  const loc = (obj: Record<string, string> | null | undefined) =>
    obj?.[locale] || obj?.en || obj?.ar || "";

  const handleEnroll = async () => {
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }
    setEnrolling(true);
    try {
      await api.post(`/courses/${slug}/enroll/`);
      mutate();
    } catch {} finally { setEnrolling(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (!course || error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4" style={{ color: "var(--color-text)" }}>404</h1>
          <Link href={`/${locale}/academy/courses`} className="px-6 py-3 rounded-xl font-semibold text-white" style={{ background: "var(--color-primary)" }}>
            {t("title")}
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);

  return (
    <main style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full animate-morph" style={{ background: "var(--color-primary)" }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <Link href={`/${locale}/academy/courses`} className="inline-flex items-center gap-2 mb-6 text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
            ← {t("title")}
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Info */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-success)", color: "white" }}>{t("free")}</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{t(course.level)}</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                  {course.language === "ar" ? "العربية" : "English"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold mb-4 leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
                {loc(course.title)}
              </h1>
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: "var(--color-text-muted)" }}>
                {loc(course.description)}
              </p>

              {/* Instructor */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  {course.instructor_avatar ? (
                    <img src={course.instructor_avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    (loc(course.instructor_name) || "?").charAt(0)
                  )}
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("instructor")}</p>
                  {course.instructor_url ? (
                    <a href={course.instructor_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline" style={{ color: "var(--color-primary)" }}>
                      {loc(course.instructor_name)} ↗
                    </a>
                  ) : (
                    <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>{loc(course.instructor_name)}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <span>🎬 {totalLessons} {t("lessons")}</span>
                <span>⏱ {course.duration_hours} {t("hours")}</span>
                <span>👥 {course.students_count} {t("students")}</span>
              </div>

              {/* Progress bar for enrolled */}
              {course.is_enrolled && course.enrollment_progress !== null && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span style={{ color: "var(--color-text-muted)" }}>{t("progress")}</span>
                    <span className="font-bold" style={{ color: "var(--color-primary)" }}>{course.enrollment_progress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${course.enrollment_progress}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }} />
                  </div>
                </div>
              )}
            </div>

            {/* CTA Card */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl overflow-hidden sticky top-24" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                {course.thumbnail && (
                  <img src={course.thumbnail} alt="" className="w-full h-44 object-cover" />
                )}
                <div className="p-5">
                  {course.is_enrolled ? (
                    <Link
                      href={`/${locale}/academy/courses/${slug}/learn`}
                      className="block w-full text-center py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                    >
                      {course.enrollment_progress && course.enrollment_progress > 0 ? t("continueLearning") : t("startLearning")} ←
                    </Link>
                  ) : user ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                    >
                      {enrolling ? t("enrolling") : t("enrollNow")}
                    </button>
                  ) : (
                    <Link
                      href={`/${locale}/login`}
                      className="block w-full text-center py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
                      style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                    >
                      {t("loginToEnroll")}
                    </Link>
                  )}
                  <p className="text-center text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                    ✓ {t("free")} • 🎬 {totalLessons} {t("lessons")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
          {t("courseContent")}
        </h2>
        <div className="space-y-3">
          {course.chapters.map((chapter, ci) => {
            const isOpen = openChapters.includes(ci);
            return (
              <div key={chapter.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <button
                  onClick={() => setOpenChapters((prev) => isOpen ? prev.filter((x) => x !== ci) : [...prev, ci])}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-start transition-colors"
                  style={{ background: isOpen ? "var(--color-surface-alt)" : "transparent" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                      {ci + 1}
                    </span>
                    <span className="font-bold text-sm sm:text-base" style={{ color: "var(--color-text)" }}>{loc(chapter.title)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{chapter.lessons.length} {t("lessons")}</span>
                    <span className="transition-transform" style={{ color: "var(--color-text-muted)", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
                  </div>
                </button>
                {isOpen && (
                  <div>
                    {chapter.lessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center justify-between px-4 sm:px-5 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm shrink-0" style={{ color: "var(--color-text-muted)" }}>▶</span>
                          <span className="text-sm truncate" style={{ color: "var(--color-text)" }}>{loc(lesson.title)}</span>
                          {lesson.is_free_preview && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}>
                              {t("freePreview")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>{lesson.duration_minutes}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

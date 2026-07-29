"use client";

import { useState, useEffect, useMemo } from "react";
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
  chapters: Chapter[];
  is_enrolled: boolean;
  enrollment_progress: number | null;
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || "en";
  const slug = params.slug as string;
  const t = useTranslations("courses");
  const tCommon = useTranslations("common");
  const { user, loadUser } = useAuthStore();

  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { loadUser(); }, [loadUser]);

  const { data: course, error, isLoading, mutate } = useSWR<CourseDetail>(
    user ? `/courses/${slug}/` : null,
    fetcher
  );

  const { data: completedData, mutate: mutateCompleted } = useSWR<{ completed_lesson_ids: number[]; progress: number }>(
    user && course?.is_enrolled ? `/courses/${slug}/completed/` : null,
    fetcher
  );

  useEffect(() => {
    if (completedData) setCompletedIds(completedData.completed_lesson_ids);
  }, [completedData]);

  const loc = (obj: Record<string, string> | null | undefined) =>
    obj?.[locale] || obj?.en || obj?.ar || "";

  // Flatten all lessons with chapter info
  const allLessons = useMemo(() => {
    if (!course) return [];
    return course.chapters.flatMap((ch, ci) =>
      ch.lessons.map((l, li) => ({ ...l, chapterIndex: ci, lessonIndex: li, chapterTitle: loc(ch.title) }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, locale]);

  // Set initial lesson
  useEffect(() => {
    if (allLessons.length > 0 && !currentLesson) {
      // Resume from first incomplete lesson
      const firstIncomplete = allLessons.find((l) => !completedIds.includes(l.id));
      setCurrentLesson(firstIncomplete || allLessons[0]);
    }
  }, [allLessons, currentLesson, completedIds]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && user === null) {
      const timer = setTimeout(() => router.push(`/${locale}/login`), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, locale]);

  const toggleComplete = async (lessonId: number) => {
    if (!course?.is_enrolled) return;
    // Optimistic update
    setCompletedIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
    try {
      await api.post(`/courses/lessons/${lessonId}/complete/`);
      mutateCompleted();
      mutate();
    } catch {
      // Revert on failure
      mutateCompleted();
    }
  };

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const progress = completedData?.progress ?? course?.enrollment_progress ?? 0;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
            <span className="text-white text-2xl font-bold">آ</span>
          </div>
          <p style={{ color: "var(--color-text-muted)" }}>{user === null ? t("loginRequired") : tCommon("loading")}</p>
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

  // Not enrolled — show enroll prompt
  if (!course.is_enrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
        <div className="text-center max-w-md p-8 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="text-5xl mb-4">🎓</div>
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>{loc(course.title)}</h2>
          <button
            onClick={async () => {
              try {
                await api.post(`/courses/${slug}/enroll/`);
                mutate();
              } catch {}
            }}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("enrollNow")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b shrink-0" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/${locale}/academy/courses/${slug}`} className="text-sm font-semibold shrink-0" style={{ color: "var(--color-primary)" }}>
            ← {t("backToCourse")}
          </Link>
          <span className="text-sm font-bold truncate hidden sm:block" style={{ color: "var(--color-text)" }}>{loc(course.title)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{progress}%</span>
          <div className="w-24 sm:w-32 h-2 rounded-full overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }} />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg lg:hidden"
            style={{ color: "var(--color-text)" }}
          >
            ☰
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video + lesson info */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video */}
          <div className="w-full bg-black aspect-video">
            {currentLesson?.video_url ? (
              <iframe
                key={currentLesson.id}
                src={`${currentLesson.video_url}?rel=0`}
                title={loc(currentLesson.title)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <p>{t("noCourses")}</p>
              </div>
            )}
          </div>

          {/* Lesson info + controls */}
          {currentLesson && (
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
                    {(currentLesson as any).chapterTitle}
                  </p>
                  <h1 className="text-lg sm:text-xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                    {loc(currentLesson.title)}
                  </h1>
                </div>
                <button
                  onClick={() => toggleComplete(currentLesson.id)}
                  className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={completedIds.includes(currentLesson.id)
                    ? { background: "var(--color-success)", color: "white" }
                    : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                >
                  {completedIds.includes(currentLesson.id) ? `✓ ${t("completed")}` : t("markComplete")}
                </button>
              </div>

              {/* Prev/Next */}
              <div className="flex items-center justify-between gap-3">
                {prevLesson ? (
                  <button
                    onClick={() => setCurrentLesson(prevLesson)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
                  >
                    → {t("prevLesson")}
                  </button>
                ) : <span />}
                {nextLesson && (
                  <button
                    onClick={() => setCurrentLesson(nextLesson)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {t("nextLesson")} ←
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — lesson list */}
        <aside
          className={`${sidebarOpen ? "flex" : "hidden"} lg:flex flex-col w-full lg:w-96 border-t lg:border-t-0 lg:border-s shrink-0 overflow-hidden`}
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", maxHeight: "calc(100vh - 57px)" }}
        >
          <div className="p-4 border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
            <h2 className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{t("courseContent")}</h2>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {completedIds.length} / {allLessons.length} {t("lessons")}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {course.chapters.map((chapter, ci) => (
              <div key={chapter.id}>
                <div className="px-4 py-3 sticky top-0" style={{ background: "var(--color-surface-alt)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>
                    {ci + 1}. {loc(chapter.title)}
                  </p>
                </div>
                {chapter.lessons.map((lesson) => {
                  const isCurrent = currentLesson?.id === lesson.id;
                  const isCompleted = completedIds.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setCurrentLesson(lesson); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-start transition-all border-s-2"
                      style={{
                        background: isCurrent ? "var(--color-primary-light)" : "transparent",
                        borderColor: isCurrent ? "var(--color-primary)" : "transparent",
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold"
                        style={{
                          background: isCompleted ? "var(--color-success)" : "var(--color-surface-alt)",
                          color: isCompleted ? "white" : "var(--color-text-muted)",
                        }}
                      >
                        {isCompleted ? "✓" : lesson.order + 1}
                      </span>
                      <span className="flex-1 text-xs sm:text-sm min-w-0 truncate" style={{ color: isCurrent ? "var(--color-primary)" : "var(--color-text)", fontWeight: isCurrent ? 700 : 400 }}>
                        {loc(lesson.title)}
                      </span>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>{lesson.duration_minutes}m</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

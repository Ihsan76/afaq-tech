"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useApiList } from "@/lib/useApi";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface Course {
  id: number;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  thumbnail: string;
  category_name: Record<string, string> | null;
  category_slug: string | null;
  instructor_name: Record<string, string>;
  level: string;
  language: string;
  duration_hours: number;
  is_free: boolean;
  price: string;
  is_featured: boolean;
  lessons_count: number;
  students_count: number;
}

interface Category {
  id: number;
  slug: string;
  icon: string;
  name: Record<string, string>;
  courses_count: number;
}

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  beginner: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  intermediate: { bg: "var(--color-warning-light)", color: "var(--color-warning)" },
  advanced: { bg: "var(--color-error-light)", color: "var(--color-error)" },
};

export default function CoursesPage() {
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const t = useTranslations("courses");

  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");

  const queryParams: Record<string, string> = {};
  if (category) queryParams.category = category;
  if (level) queryParams.level = level;
  if (language) queryParams.language = language;
  if (search) queryParams.search = search;

  const { data: courses, loading } = useApiList<Course>("/courses/", Object.keys(queryParams).length ? queryParams : undefined);
  const { data: categories } = useApiList<Category>("/courses/categories/");

  const loc = (obj: Record<string, string> | null | undefined) =>
    obj?.[locale] || obj?.en || obj?.ar || "";

  return (
    <main style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Hero */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full animate-morph" style={{ background: "var(--color-primary)" }} />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full animate-morph" style={{ background: "var(--color-secondary)", animationDelay: "2s" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            <span className="gradient-text">{t("title")}</span>
          </h1>
          <p className="text-lg sm:text-xl" style={{ color: "var(--color-text-muted)" }}>{t("subtitle")}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 mb-8 items-stretch lg:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory("")}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={!category ? { background: "var(--color-primary)", color: "white" } : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
            >
              {t("all")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1"
                style={category === cat.slug ? { background: "var(--color-primary)", color: "white" } : { background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
              >
                <span>{cat.icon}</span>
                <span>{loc(cat.name)}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <SelectDropdown
              value={level}
              onChange={(v) => setLevel(String(v))}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            >
              <option value="">{t("allLevels")}</option>
              <option value="beginner">{t("beginner")}</option>
              <option value="intermediate">{t("intermediate")}</option>
              <option value="advanced">{t("advanced")}</option>
            </SelectDropdown>
            <SelectDropdown
              value={language}
              onChange={(v) => setLanguage(String(v))}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            >
              <option value="">{t("allLanguages")}</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </SelectDropdown>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="px-4 py-2 rounded-xl text-sm w-full sm:w-56"
              style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center animate-pulse" style={{ background: "var(--color-primary)" }}>
              <span className="text-white text-xl font-bold">آ</span>
            </div>
            {t("loading")}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            <p className="text-xl">{t("noCourses")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const lvl = LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner;
              return (
                <Link
                  key={course.id}
                  href={`/${locale}/academy/courses/${course.slug}`}
                  className="group rounded-3xl overflow-hidden hover-lift transition-all duration-300"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-44 overflow-hidden" style={{ background: "var(--color-surface-alt)" }}>
                    {course.thumbnail && (
                      <img src={course.thumbnail} alt={loc(course.title)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    )}
                    <div className="absolute top-3 inset-inline-start-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-success)", color: "white" }}>
                        {t("free")}
                      </span>
                      {course.is_featured && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "var(--color-warning)", color: "white" }}>★</span>
                      )}
                    </div>
                    <div className="absolute bottom-3 inset-inline-end-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}>
                        {course.language === "ar" ? "العربية" : "English"}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: lvl.bg, color: lvl.color }}>
                        {t(course.level)}
                      </span>
                      {course.category_name && (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{loc(course.category_name)}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-base mb-2 line-clamp-2" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
                      {loc(course.title)}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: "var(--color-text-muted)" }}>
                      {loc(course.description)}
                    </p>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-text-muted)" }}>
                      <div className="flex items-center gap-3">
                        <span>🎬 {course.lessons_count} {t("lessons")}</span>
                        <span>⏱ {course.duration_hours} {t("hours")}</span>
                      </div>
                      <span className="truncate max-w-[40%]">{loc(course.instructor_name)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

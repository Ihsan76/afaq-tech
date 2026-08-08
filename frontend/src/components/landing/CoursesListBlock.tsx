"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApiList } from "@/lib/useApi";
import { localized } from "@/lib/i18n";

interface Course {
  id: number;
  slug: string;
  thumbnail: string;
  translations: Record<string, Record<string, string>>;
  level: string;
  language: string;
  is_free: boolean;
  is_featured: boolean;
  lessons_count: number;
  duration_hours: number;
}

const LEVEL_EMOJIS: Record<string, string> = { beginner: "🌱", intermediate: "🚀", advanced: "🔥" };

export default function CoursesListBlock({ content }: { content?: Record<string, any> }) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const { data: courses } = useApiList<Course>("/courses/", { is_published: true });
  const featured = courses.filter((crs) => crs.is_featured).slice(0, 6);
  const items = featured.length > 0 ? featured : courses.slice(0, 6);

  const title = c.title?.[locale] || c.title?.ar || t("academy.featuredCourses");
  const subtitle = c.subtitle?.[locale] || c.subtitle?.ar || t("academy.featuredSubtitle");

  if (items.length === 0) return null;

  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>
            {title}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>{subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((course) => (
            <Link
              key={course.id}
              href={`/${locale}/academy/courses/${course.slug}`}
              className="group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}
            >
              {course.thumbnail && (
                <div className="relative overflow-hidden h-48">
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {course.is_free && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-md" style={{ background: "var(--color-success)" }}>
                      {t("courses.free")}
                    </span>
                  )}
                </div>
              )}
              <div className="p-6 text-start">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
                  <span>{LEVEL_EMOJIS[course.level] || ""} {t(`courses.${course.level}`)}</span>
                  <span>•</span>
                  <span>{course.lessons_count} {t("courses.lessons")}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 line-clamp-1" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                  {localized(course.translations, locale, "title")}
                </h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                  {localized(course.translations, locale, "description")}
                </p>
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                    ⏱ {course.duration_hours} {t("academy.statCourses") || "ساعات"}
                  </span>
                  <span className="text-sm font-bold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform" style={{ color: "var(--color-primary)" }}>
                    {t("common.next") || "عرض"} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href={`/${locale}/academy/courses`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("academy.viewAllCourses")} ←
          </Link>
        </div>
      </div>
    </section>
  );
}

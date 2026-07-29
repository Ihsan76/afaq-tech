"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useApiList } from "@/lib/useApi";
import { localized } from "@/lib/i18n";

interface Course {
  id: number; slug: string; thumbnail: string;
  translations: Record<string, Record<string, string>>;
  level: string; language: string; is_free: boolean; is_featured: boolean;
  lessons_count: number; students_count: number;
  duration_hours: number;
}

interface Category {
  id: number; slug: string; icon: string;
  translations: Record<string, Record<string, string>>;
}

const LEVELS = ["beginner", "intermediate", "advanced"];
const LEVEL_EMOJIS: Record<string, string> = { beginner: "🌱", intermediate: "🚀", advanced: "🔥" };

export default function AcademyPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const { data: courses, loading } = useApiList<Course>("/courses/", { is_published: true });
  const { data: categories } = useApiList<Category>("/courses/categories/");

  const featured = courses.filter((c) => c.is_featured).slice(0, 6);
  const totalStudents = courses.reduce((sum, c) => sum + (c.students_count || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28 text-center"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {t("academy.heroTitle")}
          </h1>
          <p className="text-lg sm:text-xl mb-8 opacity-90 text-white max-w-2xl mx-auto">
            {t("academy.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`/${locale}/academy/courses`}
              className="px-8 py-3.5 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              style={{ background: "white", color: "var(--color-primary)" }}>
              {t("academy.browseCourses")} ←
            </Link>
            <Link href={`/${locale}/academy/courses`}
              className="px-8 py-3.5 rounded-2xl font-bold text-base border-2 border-white text-white hover:bg-white/10 transition-all">
              {t("academy.startLearning")}
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "50px 50px, 30px 30px",
        }} />
      </section>

      {/* Stats */}
      {!loading && (
        <section className="py-12 -mt-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-4 rounded-3xl p-6 shadow-xl border" style={{
              background: "var(--color-surface)", borderColor: "var(--color-border)",
              backdropFilter: "blur(12px)",
            }}>
              {[
                { num: courses.length, label: t("academy.statCourses"), icon: "🎬" },
                { num: totalStudents, label: t("academy.statStudents"), icon: "👨‍🎓" },
                { num: categories.length, label: t("academy.statCategories"), icon: "📂" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                    {stat.num < 10 ? stat.num : stat.num}+
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: "var(--color-text-muted)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      {featured.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
                {t("academy.featuredCourses")}
              </h2>
              <p style={{ color: "var(--color-text-muted)" }}>{t("academy.featuredSubtitle")}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((course) => (
                <Link key={course.id} href={`/${locale}/academy/courses/${course.slug}`}
                  className="group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                  {course.thumbnail && (
                    <div className="relative overflow-hidden h-44">
                      <img src={course.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {course.is_free && (
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: "var(--color-success)" }}>{t("courses.free")}</span>
                      )}
                    </div>
                  )}
                  <div className="p-5 text-right">
                    <h3 className="font-bold text-base mb-1 line-clamp-1" style={{ color: "var(--color-text)" }}>
                      {localized(course.translations, locale, "title")}
                    </h3>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--color-text-muted)" }}>
                      {localized(course.translations, locale, "description")}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      <span>{LEVEL_EMOJIS[course.level] || ""} {t(`courses.${course.level}`)}</span>
                      <span>•</span>
                      <span>{course.lessons_count} {t("courses.lessons")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href={`/${locale}/academy/courses`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                {t("academy.viewAllCourses")} ←
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12" style={{ background: "var(--color-surface-alt)" }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("academy.categoriesTitle")}
            </h2>
            <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>{t("academy.categoriesSubtitle")}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {categories.map((cat) => {
                const name = localized(cat.translations, locale, "name");
                const count = courses.filter((c) => {
                  const catId = (c as any).category;
                  return catId === cat.id;
                }).length;
                return (
                  <Link key={cat.id} href={`/${locale}/academy/courses?category=${cat.id}`}
                    className="group px-6 py-4 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-md"
                    style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <span className="text-2xl block mb-1">{cat.icon || "📁"}</span>
                    <span className="text-sm font-bold block" style={{ color: "var(--color-text)" }}>{name || cat.slug}</span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{count} {t("courses.courses")}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All Levels */}
      {courses.length > 0 && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
              {t("academy.levelsTitle")}
            </h2>
            <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>{t("academy.levelsSubtitle")}</p>
            <div className="grid sm:grid-cols-3 gap-5">
              {LEVELS.map((level) => {
                const count = courses.filter((c) => c.level === level).length;
                const colors: Record<string, string> = {
                  beginner: "var(--color-success-light)",
                  intermediate: "var(--color-warning-light)",
                  advanced: "var(--color-error-light)",
                };
                return (
                  <Link key={level} href={`/${locale}/academy/courses?level=${level}`}
                    className="p-6 rounded-3xl transition-all hover:-translate-y-1 hover:shadow-md"
                    style={{ background: colors[level] || "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                    <div className="text-4xl mb-3">{LEVEL_EMOJIS[level]}</div>
                    <h3 className="font-bold text-lg mb-1" style={{ color: "var(--color-text)" }}>{t(`courses.${level}`)}</h3>
                    <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{count} {t("courses.courses")}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 text-center" style={{
        background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
      }}>
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {t("academy.ctaTitle")}
          </h2>
          <p className="mb-8 opacity-90 text-white">{t("academy.ctaSubtitle")}</p>
          <Link href={`/${locale}/register`}
            className="inline-block px-10 py-3.5 rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            style={{ background: "white", color: "var(--color-primary)" }}>
            {t("academy.ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}

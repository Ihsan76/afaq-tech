"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import RoleGuard from "@/components/school/RoleGuard";

interface Enrollment {
  id: number;
  course: {
    id: number;
    slug: string;
    translations: Record<string, Record<string, string>>;
    thumbnail: string;
    level: string;
    duration_hours: number;
  };
  progress: number;
  total_lessons: number;
  enrolled_at: string;
}

export default function MyCoursesClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const res = await api.get("/courses/my/");
      setEnrollments(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowed={["student", "teacher", "admin", "creator"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="mb-8 border-b pb-6" style={{ borderColor: "var(--color-border)" }}>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {locale === "ar" ? "دوراتي التعليمية" : "My Enrolled Courses"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            {locale === "ar" ? "تابع تقدمك في الدورات المسجل بها واستكمل رحلتك التعليمية" : "Track your progress and continue learning"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border p-8" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-lg font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "لم تقم بالتسجيل في أي دورة بعد." : "You haven't enrolled in any courses yet."}
            </p>
            <Link
              href={`/${locale}/courses`}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-lg"
              style={{ background: "var(--color-primary)" }}
            >
              {locale === "ar" ? "استعرض الدورات المتاحة" : "Browse Courses"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((item) => {
              const course = item.course;
              const title = localized(course?.translations, locale, "title") || "Course";
              const desc = localized(course?.translations, locale, "description") || "";
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border overflow-hidden shadow-xl transition-all hover:scale-[1.01]"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  {course?.thumbnail && (
                    <img src={course.thumbnail} alt={title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                      {title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-4" style={{ color: "var(--color-text-secondary)" }}>
                      {desc}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>
                        <span>{locale === "ar" ? "نسبة الإنجاز" : "Progress"}</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.progress}%`, background: "var(--color-primary)" }}
                        />
                      </div>
                    </div>

                    <Link
                      href={`/${locale}/courses/${course?.slug}`}
                      className="block text-center w-full py-3 rounded-2xl text-sm font-bold border transition-all"
                      style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}
                    >
                      {locale === "ar" ? "متابعة التعلم" : "Continue Learning"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

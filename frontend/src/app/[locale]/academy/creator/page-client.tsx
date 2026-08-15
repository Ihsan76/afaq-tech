"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import RoleGuard from "@/components/school/RoleGuard";

interface CourseCategory {
  id: number;
  slug: string;
  translations: Record<string, Record<string, string>>;
}

interface Course {
  id: number;
  slug: string;
  translations: Record<string, Record<string, string>>;
  category: number | null;
  thumbnail: string;
  level: string;
  duration_hours: number;
  is_free: boolean;
  price: string;
  is_published: boolean;
  is_featured: boolean;
  lessons_count: number;
  students_count: number;
}

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function CreatorCoursesClient() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Form state
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formLevel, setFormLevel] = useState("beginner");
  const [formLanguage, setFormLanguage] = useState(locale);
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formDuration, setFormDuration] = useState(1);
  const [formIsFree, setFormIsFree] = useState(true);
  const [formPrice, setFormPrice] = useState("0");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formTitleAr, setFormTitleAr] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formDescAr, setFormDescAr] = useState("");
  const [formDescEn, setFormDescEn] = useState("");

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/admin/list/");
      setCourses(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/courses/categories/");
      setCategories(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {}
  };

  const resetForm = () => {
    setFormSlug("");
    setFormCategory("");
    setFormLevel("beginner");
    setFormLanguage(locale);
    setFormThumbnail("");
    setFormDuration(1);
    setFormIsFree(true);
    setFormPrice("0");
    setFormIsPublished(true);
    setFormIsFeatured(false);
    setFormTitleAr("");
    setFormTitleEn("");
    setFormDescAr("");
    setFormDescEn("");
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleEdit = (c: Course) => {
    setEditingCourse(c);
    setFormSlug(c.slug);
    setFormCategory(c.category || "");
    setFormLevel(c.level);
    setFormLanguage("ar");
    setFormThumbnail(c.thumbnail || "");
    setFormDuration(c.duration_hours || 1);
    setFormIsFree(c.is_free);
    setFormPrice(c.price || "0");
    setFormIsPublished(c.is_published);
    setFormIsFeatured(c.is_featured);
    setFormTitleAr(c.translations?.ar?.title || "");
    setFormTitleEn(c.translations?.en?.title || "");
    setFormDescAr(c.translations?.ar?.description || "");
    setFormDescEn(c.translations?.en?.description || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      slug: formSlug,
      category: formCategory === "" ? null : formCategory,
      level: formLevel,
      language: formLanguage,
      thumbnail: formThumbnail,
      duration_hours: Number(formDuration),
      is_free: formIsFree,
      price: formIsFree ? "0.00" : formPrice,
      is_published: formIsPublished,
      is_featured: formIsFeatured,
      translations: {
        ar: { title: formTitleAr, description: formDescAr },
        en: { title: formTitleEn, description: formDescEn },
      },
    };

    try {
      if (editingCourse) {
        await api.put(`/courses/admin/${editingCourse.id}/`, payload);
      } else {
        await api.post("/courses/admin/create/", payload);
      }
      resetForm();
      fetchCourses();
    } catch (err: any) {
      alert(locale === "ar" ? "حدث خطأ أثناء حفظ الدورة" : "Error saving course");
    }
  };

  return (
    <RoleGuard allowed={["teacher", "admin", "creator"]}>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" style={{ color: "var(--color-text)" }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 gap-4" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              {locale === "ar" ? "لوحة تحكم المحاضر وصانع المحتوى" : "Instructor & Creator Portal"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "إدارة الدورات التدريبية والدروس والمحتوى التعليمي الخاص بك" : "Manage your courses, lessons and educational content"}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all"
            style={{ background: "var(--color-primary)" }}
          >
            {locale === "ar" ? "+ إنشاء دورة جديدة" : "+ Create New Course"}
          </button>
        </div>

        {showForm && (
          <div className="mb-10 p-6 rounded-3xl border shadow-xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              {editingCourse ? (locale === "ar" ? "تعديل الدورة" : "Edit Course") : (locale === "ar" ? "إضافة دورة جديدة" : "Add Course")}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "معرّف الرابط (Slug)" : "Slug"}
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  placeholder="e.g. python-masterclass"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "التصنيف" : "Category"}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  <option value="">{locale === "ar" ? "بدون تصنيف" : "No Category"}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {localized(cat.translations, locale, "name") || cat.slug}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "العنوان بالعربية" : "Arabic Title"}
                </label>
                <input
                  type="text"
                  required
                  value={formTitleAr}
                  onChange={(e) => setFormTitleAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "العنوان بالإنجليزية" : "English Title"}
                </label>
                <input
                  type="text"
                  required
                  value={formTitleEn}
                  onChange={(e) => setFormTitleEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "المستوى" : "Level"}
                </label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "رابط الصورة المصغرة (Thumbnail URL)" : "Thumbnail URL"}
                </label>
                <input
                  type="url"
                  value={formThumbnail}
                  onChange={(e) => setFormThumbnail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "الوصف بالعربية" : "Arabic Description"}
                </label>
                <textarea
                  rows={3}
                  value={formDescAr}
                  onChange={(e) => setFormDescAr(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--color-text-muted)" }}>
                  {locale === "ar" ? "الوصف بالإنجليزية" : "English Description"}
                </label>
                <textarea
                  rows={3}
                  value={formDescEn}
                  onChange={(e) => setFormDescEn(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-sm"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                />
              </div>

              <div className="flex items-center gap-6 md:col-span-2 pt-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsFree}
                    onChange={(e) => setFormIsFree(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  {locale === "ar" ? "دورة مجانية" : "Free Course"}
                </label>

                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  {locale === "ar" ? "منشورة" : "Published"}
                </label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-4 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 rounded-2xl text-sm font-bold border transition-all"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}
                >
                  {locale === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-all"
                  style={{ background: "var(--color-primary)" }}
                >
                  {locale === "ar" ? "حفظ الدورة" : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-text-muted)" }}>
            {locale === "ar" ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border p-8" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-lg font-medium mb-4" style={{ color: "var(--color-text-secondary)" }}>
              {locale === "ar" ? "لا توجد دورات مضافة بعد." : "No courses added yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const title = localized(course.translations, locale, "title") || course.slug;
              return (
                <div
                  key={course.id}
                  className="rounded-3xl border overflow-hidden shadow-xl flex flex-col justify-between"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                >
                  {course.thumbnail && (
                    <img src={course.thumbnail} alt={title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs px-3 py-1 rounded-full font-bold uppercase" style={{ background: "var(--color-background)", color: "var(--color-primary)", border: "1px solid var(--color-border)" }}>
                          {course.level}
                        </span>
                        <span className="text-xs font-bold" style={{ color: course.is_published ? "#10b981" : "#f59e0b" }}>
                          {course.is_published ? (locale === "ar" ? "منشورة" : "Published") : (locale === "ar" ? "مسودة" : "Draft")}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                        {title}
                      </h3>
                      <div className="flex gap-4 text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
                        <span>{course.lessons_count} {locale === "ar" ? "درس" : "lessons"}</span>
                        <span>{course.students_count} {locale === "ar" ? "طالب" : "students"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                      <button
                        onClick={() => handleEdit(course)}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all text-center"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}
                      >
                        {locale === "ar" ? "تعديل" : "Edit"}
                      </button>
                      <Link
                        href={`/${locale}/courses/${course.slug}`}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all text-center shadow"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {locale === "ar" ? "عرض" : "View"}
                      </Link>
                    </div>
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

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { localized } from "@/lib/i18n";
import { locales, localeNames } from "@/i18n/config";

interface CourseCategory {
  id: number; slug: string; icon: string; translations: Record<string, Record<string, string>>;
}

interface Course {
  id: number; slug: string; translations: Record<string, Record<string, string>>;
  category: number | null; category_name: Record<string, string> | null;
  thumbnail: string; level: string; language: string; duration_hours: number;
  is_free: boolean; price: string; is_published: boolean; is_featured: boolean;
  lessons_count: number; students_count: number;
  instructor_translations?: Record<string, Record<string, string>>;
  instructor_url?: string;
}

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function AdminCoursesPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [dirty, setDirty] = useState(false);

  const [formTranslations, setFormTranslations] = useState<Record<string, Record<string, string>>>({});
  const [formLocale, setFormLocale] = useState<string>(locale);
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formLevel, setFormLevel] = useState("beginner");
  const [formLanguage, setFormLanguage] = useState("ar");
  const [formThumbnail, setFormThumbnail] = useState("");
  const [formDuration, setFormDuration] = useState(1);
  const [formIsFree, setFormIsFree] = useState(true);
  const [formPrice, setFormPrice] = useState("0");
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formInstructorUrl, setFormInstructorUrl] = useState("");

  useEffect(() => { fetchCourses(); fetchCategories(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/admin/list/");
      setCourses(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/courses/categories/");
      setCategories(res.data.results || res.data);
    } catch {}
  };

  const resetForm = () => {
    setFormTranslations({}); setFormSlug(""); setFormCategory("");
    setFormLevel("beginner"); setFormLanguage("ar"); setFormThumbnail("");
    setFormDuration(1); setFormIsFree(true); setFormPrice("0");
    setFormIsPublished(true); setFormIsFeatured(false); setFormInstructorUrl("");
    setEditingCourse(null); setShowForm(false); setDirty(false);
  };

  const openEdit = (course: Course) => {
    const doOpen = () => {
      setEditingCourse(course);
      setFormTranslations(course.translations || {});
      setFormSlug(course.slug);
      setFormCategory(course.category || "");
      setFormLevel(course.level); setFormLanguage(course.language);
      setFormThumbnail(course.thumbnail || "");
      setFormDuration(course.duration_hours);
      setFormIsFree(course.is_free); setFormPrice(course.price || "0");
      setFormIsPublished(course.is_published); setFormIsFeatured(course.is_featured);
      setFormInstructorUrl(course.instructor_url || "");
      setShowForm(true); setDirty(false);
    };
    confirmIfDirty(doOpen);
  };

  const updateTranslation = (loc: string, field: string, value: string) => {
    setFormTranslations((prev) => ({ ...prev, [loc]: { ...(prev[loc] || {}), [field]: value } }));
    setDirty(true);
  };

  const markDirty = () => setDirty(true);

  const confirmIfDirty = (action: () => void) => {
    if (dirty && !confirm(t("admin.confirmUnsaved"))) return;
    action();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      translations: formTranslations,
      instructor_translations: editingCourse?.instructor_translations || {
        ar: { name: "آفاق تكنولوجي" }, en: { name: "Afaq Tech" },
      },
      slug: formSlug,
      category: formCategory || null,
      level: formLevel,
      language: formLanguage,
      thumbnail: formThumbnail,
      duration_hours: formDuration,
      is_free: formIsFree,
      price: formIsFree ? 0 : parseFloat(formPrice) || 0,
      is_published: formIsPublished,
      is_featured: formIsFeatured,
      instructor_avatar: "",
      instructor_url: formInstructorUrl,
    };
    try {
      if (editingCourse) {
        await api.put(`/courses/admin/${editingCourse.id}/`, payload);
      } else {
        await api.post("/courses/admin/create/", payload);
      }
      resetForm(); fetchCourses();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("admin.confirmDeletePost"))) return;
    try { await api.delete(`/courses/admin/${id}/`); fetchCourses(); } catch {}
  };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";
  const style = { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" };
  const isRtl = formLocale === "ar" || formLocale === "ur";

  const getCategoryName = (cat: CourseCategory) => localized(cat.translations, locale, "name");

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.courses")} ({courses.length})
        </h1>
        <button onClick={() => confirmIfDirty(() => { resetForm(); setShowForm(true); })}
          className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
          style={{ background: "var(--btn-primary-bg)" }}>
          + {t("admin.newCourse")}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 rounded-3xl border" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
              {editingCourse ? t("admin.editCourse") : t("admin.newCourse")}
            </h2>
            {dirty && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>{t("admin.unsaved")}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
            <select value={formLocale} onChange={(e) => setFormLocale(e.target.value)} className={inputCls + " max-w-xs"} style={style}>
              {locales.map((loc) => (
                <option key={loc} value={loc}>{localeNames[loc]} ({loc.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")} ({formLocale.toUpperCase()})</label>
              <input value={formTranslations[formLocale]?.title || ""} onChange={(e) => { updateTranslation(formLocale, "title", e.target.value); if (!editingCourse) setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }}
                className={inputCls} style={style} dir={isRtl ? "rtl" : "ltr"} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.slug")}</label>
              <input value={formSlug} onChange={(e) => { setFormSlug(e.target.value); markDirty(); }} className={inputCls} style={style} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.description")} ({formLocale.toUpperCase()})</label>
              <textarea value={formTranslations[formLocale]?.description || ""} onChange={(e) => updateTranslation(formLocale, "description", e.target.value)} className={inputCls + " h-20 resize-none"} style={style} dir={isRtl ? "rtl" : "ltr"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.category")}</label>
              <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value ? Number(e.target.value) : ""); markDirty(); }} className={inputCls} style={style}>
                <option value="">— {t("common.none")} —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {getCategoryName(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.level")}</label>
              <select value={formLevel} onChange={(e) => { setFormLevel(e.target.value); markDirty(); }} className={inputCls} style={style}>
                {LEVELS.map((l) => <option key={l} value={l}>{t(`courses.${l}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.language")}</label>
              <select value={formLanguage} onChange={(e) => { setFormLanguage(e.target.value); markDirty(); }} className={inputCls} style={style}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.thumbnail")}</label>
              <input value={formThumbnail} onChange={(e) => { setFormThumbnail(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://i.ytimg.com/vi/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.durationHours")}</label>
              <input type="number" step="0.5" min="0" value={formDuration} onChange={(e) => { setFormDuration(Number(e.target.value)); markDirty(); }} className={inputCls} style={style} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.instructorUrl")}</label>
              <input value={formInstructorUrl} onChange={(e) => { setFormInstructorUrl(e.target.value); markDirty(); }} className={inputCls} style={style} placeholder="https://youtube.com/@channel" />
            </div>
            {!formIsFree && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("admin.price")}</label>
                <input type="number" step="0.01" min="0" value={formPrice} onChange={(e) => { setFormPrice(e.target.value); markDirty(); }} className={inputCls} style={style} />
              </div>
            )}
            <div className="flex items-center gap-6 pt-6 flex-wrap">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formIsFree} onChange={(e) => { setFormIsFree(e.target.checked); markDirty(); }} className="w-5 h-5 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.isFree")}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formIsPublished} onChange={(e) => { setFormIsPublished(e.target.checked); markDirty(); }} className="w-5 h-5 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.published")}</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formIsFeatured} onChange={(e) => { setFormIsFeatured(e.target.checked); markDirty(); }} className="w-5 h-5 rounded" />
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("admin.featured")}</span>
              </label>
            </div>
          </div>

          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>💡 {t("admin.manageLessons")}</p>

          <div className="flex flex-wrap gap-3 items-center">
            <button type="submit" className="px-6 py-2.5 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all" style={{ background: "var(--btn-primary-bg)" }}>
              {editingCourse ? t("admin.saveChanges") : t("common.save")}
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl font-semibold border text-sm" style={style}>
              {t("common.cancel")}
            </button>
            {editingCourse && (
              <button type="button" onClick={() => { if (confirm(t("admin.confirmDeletePost"))) { handleDelete(editingCourse.id); resetForm(); } }}
                className="px-5 py-2.5 rounded-xl font-semibold border border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error-light)] transition-all ml-auto">
                {t("common.delete")}
              </button>
            )}
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ ...style }}>
          <p style={{ color: "var(--color-text-muted)" }}>{t("admin.noCourses")}</p>
        </div>
      ) : (
        <div className="rounded-3xl border overflow-x-auto" style={{ ...style, boxShadow: "var(--card-shadow)" }}>
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                <th className="px-4 py-4"></th>
                <th className="px-4 py-4 text-right text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.title")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.level")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("admin.chapters")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.status")}</th>
                <th className="px-4 py-4 text-center text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: "var(--color-border)" }}>
                  <td className="px-4 py-4">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-20 h-12 rounded-lg object-cover" style={{ border: "1px solid var(--color-border)" }} />
                    ) : (
                      <div className="w-20 h-12 rounded-lg flex items-center justify-center text-xs" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>—</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
                      {localized(course.translations, locale, "title")} {course.is_featured && <span className="text-xs">★</span>}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>/courses/{course.slug} • {course.language.toUpperCase()}</div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>{t(`courses.${course.level}`)}</td>
                  <td className="px-4 py-4 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>{course.lessons_count}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-bold" style={{
                      background: course.is_published ? "var(--color-success-light)" : "var(--color-surface-alt)",
                      color: course.is_published ? "var(--color-success)" : "var(--color-text-muted)",
                    }}>
                      {course.is_published ? t("admin.published") : t("admin.draft")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEdit(course)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>{t("common.edit")}</button>
                      <button onClick={() => handleDelete(course.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "var(--color-error)" }}>{t("common.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

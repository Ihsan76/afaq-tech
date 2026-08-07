"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface School {
  id: number;
  name: string;
  school_code: string;
  directorate: string;
  phone: string;
  address: string;
  gender?: string;
  education_type?: string;
  manager?: number | null;
  manager_email?: string;
  manager_name?: string;
}

interface UserSuggestion {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface Section {
  id: number;
  school: number;
  school_name?: string;
  grade: number;
  grade_name?: string;
  academic_year: number;
  academic_year_name?: string;
  name: string;
}

interface Announcement {
  id: number;
  school: number;
  section: number | null;
  title: string;
  content: string;
  is_emergency: boolean;
  author_email: string;
  created_at: string;
}

const PAGE_SIZES = [20, 50, 100];
const SORTS = [
  { value: "id", label: "ID" },
  { value: "name", label: "اسم المدرسة (أ-ي)" },
  { value: "-name", label: "اسم المدرسة (ي-أ)" },
  { value: "school_code", label: "رمز المدرسة" },
  { value: "directorate", label: "المديرية" },
];

export default function AdminSchoolsPage() {
  const t = useTranslations("schools");
  const commonT = useTranslations("common");
  const dashT = useTranslations("dashboard");
  const locale = useLocale();

  const roleLabel = (r: string) =>
    dashT(`role${r.charAt(0).toUpperCase() + r.slice(1).replace(/_(.)/g, (_, c) => c.toUpperCase())}`, { fallback: r });

  const [activeTab, setActiveTab] = useState<"schools" | "years" | "sections" | "announcements">("schools");
  const [loading, setLoading] = useState(true);

  // Schools list state + pagination/search/sort
  const [schools, setSchools] = useState<School[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [directorateFilter, setDirectorateFilter] = useState("");
  const [ordering, setOrdering] = useState("id");

  // Other tabs state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Modals
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<number | null>(null);
  const [schoolForm, setSchoolForm] = useState({ name: "", school_code: "", directorate: "", phone: "", address: "", gender: "", education_type: "" });

  // Manager assignment
  const [currentManager, setCurrentManager] = useState<{ id: number; email: string; name: string } | null>(null);
  const [managerQuery, setManagerQuery] = useState("");
  const [managerSuggestions, setManagerSuggestions] = useState<UserSuggestion[]>([]);
  const [managerSearching, setManagerSearching] = useState(false);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ school: 0, section: "", title: "", content: "", is_emergency: false });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (directorateFilter) params.set("directorate", directorateFilter);
      if (ordering) params.set("ordering", ordering);
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      const res = await api.get(`/schools/schools/?${params.toString()}`);
      setSchools(res.data.results || res.data);
      setTotalCount(res.data.count ?? (res.data.results || res.data).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, directorateFilter, ordering, page, pageSize]);

  const fetchOtherTab = async () => {
    setLoading(true);
    try {
      if (activeTab === "years") {
        const res = await api.get("/schools/academic-years/");
        setAcademicYears(res.data.results || res.data);
      } else if (activeTab === "sections") {
        const res = await api.get("/schools/sections/");
        setSections(res.data.results || res.data);
      } else if (activeTab === "announcements") {
        const res = await api.get("/schools/announcements/");
        setAnnouncements(res.data.results || res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "schools") {
      fetchSchools();
    } else {
      fetchOtherTab();
    }
  }, [activeTab, fetchSchools]);

  // Lock body scroll while a modal is open
  useEffect(() => {
    const modalOpen = showSchoolModal || showAnnouncementModal;
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showSchoolModal, showAnnouncementModal]);

  const handleOpenCreateModal = () => {
    setEditingSchoolId(null);
    setCurrentManager(null);
    setManagerQuery("");
    setManagerSuggestions([]);
    setSchoolForm({ name: "", school_code: "", directorate: "", phone: "", address: "", gender: "", education_type: "" });
    setShowSchoolModal(true);
  };

  const handleOpenEditModal = (school: School) => {
    setEditingSchoolId(school.id);
    setCurrentManager(school.manager ? { id: school.manager, email: school.manager_email || "", name: school.manager_name || "" } : null);
    setManagerQuery("");
    setManagerSuggestions([]);
    setSchoolForm({
      name: school.name || "",
      school_code: school.school_code || "",
      directorate: school.directorate || "",
      phone: school.phone || "",
      address: school.address || "",
      gender: school.gender || "",
      education_type: school.education_type || "",
    });
    setShowSchoolModal(true);
  };

  const searchManagers = async (q: string) => {
    setManagerQuery(q);
    if (q.trim().length < 2) { setManagerSuggestions([]); return; }
    setManagerSearching(true);
    try {
      const res = await api.get(`/auth/admin/list/?search=${encodeURIComponent(q)}&page_size=8`);
      setManagerSuggestions(res.data.results || []);
    } catch {
      setManagerSuggestions([]);
    } finally {
      setManagerSearching(false);
    }
  };

  const assignManager = async (u: UserSuggestion) => {
    if (!editingSchoolId) return;
    try {
      await api.patch(`/schools/schools/${editingSchoolId}/`, { manager: u.id });
      setCurrentManager({ id: u.id, email: u.email, name: u.name });
      setManagerQuery("");
      setManagerSuggestions([]);
      fetchSchools();
    } catch {
      alert("تعذر تعيين المدير");
    }
  };

  const removeManager = async () => {
    if (!editingSchoolId) return;
    try {
      await api.patch(`/schools/schools/${editingSchoolId}/`, { manager: null });
      setCurrentManager(null);
      fetchSchools();
    } catch {
      alert("تعذر إزالة المدير");
    }
  };

  const handleDeleteSchool = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه المدرسة؟")) return;
    try {
      await api.delete(`/schools/schools/${id}/`);
      fetchSchools();
    } catch (err) {
      alert("حدث خطأ أثناء الحذف");
    }
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSchoolId) {
        await api.patch(`/schools/schools/${editingSchoolId}/`, schoolForm);
      } else {
        await api.post("/schools/schools/", schoolForm);
      }
      setShowSchoolModal(false);
      fetchSchools();
    } catch (err) {
      alert("حدث خطأ أثناء حفظ المدرسة");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schools/announcements/", {
        ...announcementForm,
        section: announcementForm.section ? Number(announcementForm.section) : null,
      });
      setShowAnnouncementModal(false);
      setAnnouncementForm({ school: schools[0]?.id || 0, section: "", title: "", content: "", is_emergency: false });
      fetchOtherTab();
    } catch (err) {
      alert("Error publishing announcement");
    }
  };

  const inputCls = "px-4 py-2.5 rounded-xl text-sm border outline-none";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--color-surface)] p-6 rounded-3xl shadow-sm border border-[var(--color-border)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">{t("title")}</h1>
          <p className="text-[var(--color-text-muted)] mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-3">
          {activeTab === "schools" && (
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl hover:opacity-90 font-medium transition-all shadow-sm"
            >
              + {commonT("add")} {t("schoolsList")}
            </button>
          )}
          {activeTab === "announcements" && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl hover:opacity-90 font-medium transition-all shadow-sm"
            >
              + {t("sendAnnouncement")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          onClick={() => { setActiveTab("schools"); setPage(1); }}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "schools" ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"
          }`}
        >
          🏫 {t("schoolsList")}
        </button>
        <button
          onClick={() => setActiveTab("years")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "years" ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"
          }`}
        >
          📅 {t("academicYears")}
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "sections" ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"
          }`}
        >
          👥 {t("sections")}
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "announcements" ? "bg-[var(--color-primary)] text-white shadow-sm" : "bg-[var(--color-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-light)]"
          }`}
        >
          📢 {t("announcements")} & {t("emergencyAlerts")}
        </button>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-surface)] rounded-3xl shadow-sm border border-[var(--color-border)] p-6">
        {/* Schools Tab Controls: Search, Directorate Filter, Sorting */}
        {activeTab === "schools" && (
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="بحث بالاسم أو الكود أو العنوان..."
                className={`${inputCls} flex-1 min-w-[240px]`}
                style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
              />
              <input
                type="text"
                value={directorateFilter}
                onChange={(e) => { setDirectorateFilter(e.target.value); setPage(1); }}
                placeholder="فلتر المديرية..."
                className={`${inputCls} sm:w-48`}
                style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={ordering}
                onChange={(e) => setOrdering(e.target.value)}
                className={inputCls}
                style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-muted)]">{commonT("loading")}</div>
        ) : (
          <>
            {/* Schools Tab - Table View with Scrolling */}
            {activeTab === "schools" && (
              <>
                <div className="rounded-2xl border overflow-auto max-h-[650px]" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b text-sm font-bold" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text-secondary)" }}>
                        <th className="col-hide-md px-4 py-3.5 text-right">#</th>
                        <th className="col-hide-sm px-4 py-3.5 text-right">{t("schoolCode")}</th>
                        <th className="px-4 py-3.5 text-right">{t("schoolName")}</th>
                        <th className="col-hide-md px-4 py-3.5 text-right">{t("directorate")}</th>
                        <th className="col-hide-lg px-4 py-3.5 text-right">المدير</th>
                        <th className="col-hide-md px-4 py-3.5 text-right">الهاتف</th>
                        <th className="col-hide-md px-4 py-3.5 text-right">العنوان</th>
                        <th className="px-4 py-3.5 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm" style={{ borderColor: "var(--color-border)" }}>
                      {schools.map((school) => (
                        <tr key={school.id} className="transition-colors hover:bg-[var(--color-surface-alt)]">
                          <td className="col-hide-md px-4 py-3.5 text-[var(--color-text-muted)]">{school.id}</td>
                          <td className="col-hide-sm px-4 py-3.5 font-semibold" style={{ color: "var(--color-primary)" }}>{school.school_code}</td>
                          <td className="px-4 py-3.5 font-bold text-[var(--color-text)]">{school.name}</td>
                          <td className="col-hide-md px-4 py-3.5 text-[var(--color-text-secondary)]">{school.directorate || "—"}</td>
                          <td className="col-hide-lg px-4 py-3.5">
                            {school.manager_name ? (
                              <div className="min-w-0">
                                <div className="text-xs font-bold truncate" style={{ color: "var(--color-text)" }}>{school.manager_name}</div>
                                <div className="text-[10px] truncate" style={{ color: "var(--color-text-muted)" }}>{school.manager_email}</div>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                            )}
                          </td>
                          <td className="col-hide-md px-4 py-3.5 text-[var(--color-text-secondary)]" dir="ltr">{school.phone || "—"}</td>
                          <td className="col-hide-md px-4 py-3.5 text-[var(--color-text-muted)] truncate max-w-xs">{school.address || "—"}</td>
                          <td className="px-4 py-3.5 text-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => handleOpenEditModal(school)}
                              className="px-3 py-1 rounded-xl text-xs font-bold border hover:opacity-85 transition-all"
                              style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderColor: "var(--color-info)" }}
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDeleteSchool(school.id)}
                              className="px-3 py-1 rounded-xl text-xs font-bold border hover:opacity-85 transition-all"
                              style={{ background: "var(--color-error-light)", color: "var(--color-error)", borderColor: "var(--color-error)" }}
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                      {schools.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-[var(--color-text-muted)]">
                            {commonT("noResults")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-6">
                  <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    إجمالي المدارس: {totalCount.toLocaleString()} | صفحة {page} من {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
                      style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                    >
                      السابق
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-4 py-2 rounded-xl text-sm font-bold border disabled:opacity-40"
                      style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                    >
                      التالي
                    </button>
                    <select
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      className={inputCls}
                      style={{ background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                    >
                      {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} لكل صفحة</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Academic Years Tab */}
            {activeTab === "years" && (
              <div className="space-y-4">
                {academicYears.map((y) => (
                  <div key={y.id} className="flex justify-between items-center p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                    <span className="font-bold text-[var(--color-text)]">{y.name}</span>
                    {y.is_current && (
                      <span className="bg-[var(--color-success-light)] text-[var(--color-success)] text-xs px-3 py-1 rounded-full font-medium">{t("currentYear")}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === "sections" && (
              <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
                <table className="w-full text-right border-collapse">
                  <thead className="sticky top-0 z-10 bg-[var(--color-surface-alt)]">
                    <tr className="border-b text-[var(--color-text-muted)] text-sm">
                      <th className="p-3">{t("schoolName")}</th>
                      <th className="col-hide-md p-3">{t("grade")}</th>
                      <th className="p-3">{t("section")}</th>
                      <th className="p-3">{t("academicYears")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-[var(--color-text-secondary)] text-sm">
                    {sections.map((sec) => (
                      <tr key={sec.id}>
                        <td className="py-4 px-3 font-medium">{sec.school_name}</td>
                        <td className="col-hide-md py-4 px-3">{sec.grade_name}</td>
                        <td className="py-4 px-3 font-bold text-[var(--color-primary)]">{sec.name}</td>
                        <td className="py-4 px-3 text-[var(--color-text-muted)]">{sec.academic_year_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Announcements & Emergency Alerts Tab */}
            {activeTab === "announcements" && (
              <div className="space-y-4 max-h-[650px] overflow-y-auto">
                {announcements.map((ann) => (
                  <div key={ann.id} className={`p-6 rounded-2xl border ${ann.is_emergency ? "border-[var(--color-error-light)] bg-[var(--color-error-light)]" : "border-[var(--color-border)] bg-[var(--color-surface-alt)]"} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-[var(--color-text)]">{ann.title}</h3>
                        {ann.is_emergency && (
                          <span className="bg-[var(--color-error)] text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                            🚨 {t("emergencyAlertBadge")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)]">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] text-sm whitespace-pre-line">{ann.content}</p>
                    <div className="text-xs text-[var(--color-text-muted)] pt-2 border-t">{t("by")} {ann.author_email}</div>
                  </div>
                ))}
                {announcements.length === 0 && <div className="text-[var(--color-text-muted)] text-center py-8">{commonT("noResults")}</div>}
              </div>
            )}
          </>
        )}
      </div>

      {/* School Modal (Create / Edit) */}
      {showSchoolModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setShowSchoolModal(false)}>
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto my-auto">
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {editingSchoolId ? "تعديل بيانات المدرسة" : `${commonT("add")} ${t("schoolsList")}`}
            </h2>
            <form onSubmit={handleSaveSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("schoolName")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("schoolCode")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={schoolForm.school_code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, school_code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("directorate")}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={schoolForm.directorate}
                  onChange={(e) => setSchoolForm({ ...schoolForm, directorate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("phone")}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("address")}</label>
                <textarea
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                />
              </div>

              {/* School Manager */}
              {editingSchoolId && (
                <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
                  <label className="block text-sm font-bold" style={{ color: "var(--color-text)" }}>👤 {t("manager")}</label>
                  {currentManager ? (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>{currentManager.name || currentManager.email}</div>
                        <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{currentManager.email}</div>
                      </div>
                      <button
                        type="button"
                        onClick={removeManager}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 hover:opacity-85"
                        style={{ background: "var(--color-error-light)", color: "var(--color-error)", borderColor: "var(--color-error)" }}
                      >
                        {t("removeManager")}
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={managerQuery}
                        onChange={(e) => searchManagers(e.target.value)}
                        placeholder={t("managerPlaceholder")}
                        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                        style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
                      />
                      {managerSearching && <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{t("managerSearching")}</div>}
                      {managerSuggestions.length > 0 && (
                        <div className="absolute z-20 inset-x-0 mt-1 rounded-xl border shadow-lg overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                          {managerSuggestions.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => assignManager(u)}
                              className="w-full text-right px-4 py-2.5 text-sm hover:opacity-80 transition-all border-b last:border-b-0"
                              style={{ color: "var(--color-text)", borderColor: "var(--color-border)" }}
                            >
                              <span className="font-semibold">{u.name || u.email}</span>
                              <span className="text-xs block" style={{ color: "var(--color-text-muted)" }}>{u.email} — {roleLabel(u.role)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("managerAssignHint")}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
                  className="px-5 py-2.5 bg-[var(--color-muted)] text-[var(--color-text-secondary)] rounded-2xl font-medium"
                >
                  {commonT("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl font-medium"
                >
                  {commonT("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setShowAnnouncementModal(false)}>
          <div className="bg-[var(--color-surface)] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto my-auto">
            <h2 className="text-xl font-bold text-[var(--color-text)]">{t("sendAnnouncement")}</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("schoolName")}</label>
                <select
                  required
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)] outline-none"
                  value={announcementForm.school}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, school: Number(e.target.value) })}
                >
                  <option value="">{t("selectSchool")}</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("title")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t("content")}</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-[var(--color-border)] rounded-2xl outline-none"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 bg-[var(--color-error-light)] p-4 rounded-2xl border border-[var(--color-error-light)]">
                <input
                  type="checkbox"
                  id="is_emergency"
                  className="w-5 h-5 accent-[var(--color-error)] rounded"
                  checked={announcementForm.is_emergency}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_emergency: e.target.checked })}
                />
                <label htmlFor="is_emergency" className="text-sm font-bold text-[var(--color-error)] cursor-pointer">
                  {t("emergencyBadge")}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-5 py-2.5 bg-[var(--color-muted)] text-[var(--color-text-secondary)] rounded-2xl font-medium"
                >
                  {commonT("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-2xl font-medium"
                >
                  {commonT("submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

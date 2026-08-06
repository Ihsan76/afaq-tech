"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface School {
  id: number;
  name: string;
  school_code: string;
  directorate: string;
  phone: string;
  address: string;
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

export default function AdminSchoolsPage() {
  const t = useTranslations("schools");
  const commonT = useTranslations("common");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<"schools" | "years" | "sections" | "announcements">("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: "", school_code: "", directorate: "", phone: "", address: "" });

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ school: 0, section: "", title: "", content: "", is_emergency: false });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "schools") {
        const res = await api.get("/schools/schools/");
        setSchools(res.data.results || res.data);
      } else if (activeTab === "years") {
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

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/schools/schools/", schoolForm);
      setShowSchoolModal(false);
      setSchoolForm({ name: "", school_code: "", directorate: "", phone: "", address: "" });
      fetchData();
    } catch (err) {
      alert("Error creating school");
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
      fetchData();
    } catch (err) {
      alert("Error publishing announcement");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir={locale === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="text-gray-500 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-3">
          {activeTab === "schools" && (
            <button
              onClick={() => setShowSchoolModal(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-2xl hover:opacity-90 font-medium transition-all shadow-sm"
            >
              + {commonT("add")} {t("schoolsList")}
            </button>
          )}
          {activeTab === "announcements" && (
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="px-5 py-2.5 bg-primary text-white rounded-2xl hover:opacity-90 font-medium transition-all shadow-sm"
            >
              + {t("sendAnnouncement")}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("schools")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "schools" ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🏫 {t("schoolsList")}
        </button>
        <button
          onClick={() => setActiveTab("years")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "years" ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📅 {t("academicYears")}
        </button>
        <button
          onClick={() => setActiveTab("sections")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "sections" ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          👥 {t("sections")}
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
            activeTab === "announcements" ? "bg-primary text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📢 {t("announcements")} & {t("emergencyAlerts")}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">{commonT("loading")}</div>
        ) : (
          <>
            {/* Schools Tab */}
            {activeTab === "schools" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map((school) => (
                  <div key={school.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-lg text-gray-900">{school.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                        {school.school_code}
                      </span>
                    </div>
                    {school.directorate && <p className="text-sm text-gray-600">🏢 {school.directorate}</p>}
                    {school.phone && <p className="text-sm text-gray-600">📞 {school.phone}</p>}
                    {school.address && <p className="text-sm text-gray-500">📍 {school.address}</p>}
                  </div>
                ))}
                {schools.length === 0 && <div className="text-gray-400 col-span-full text-center py-8">{commonT("noResults")}</div>}
              </div>
            )}

            {/* Academic Years Tab */}
            {activeTab === "years" && (
              <div className="space-y-4">
                {academicYears.map((y) => (
                  <div key={y.id} className="flex justify-between items-center p-4 rounded-2xl border border-gray-100 bg-gray-50">
                    <span className="font-bold text-gray-800">{y.name}</span>
                    {y.is_current && (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">Current Year</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sections Tab */}
            {activeTab === "sections" && (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b text-gray-400 text-sm">
                      <th className="pb-3">{t("schoolName")}</th>
                      <th className="pb-3">{t("grade")}</th>
                      <th className="pb-3">{t("section")}</th>
                      <th className="pb-3">{t("academicYears")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700 text-sm">
                    {sections.map((sec) => (
                      <tr key={sec.id}>
                        <td className="py-4 font-medium">{sec.school_name}</td>
                        <td className="py-4">{sec.grade_name}</td>
                        <td className="py-4 font-bold text-primary">{sec.name}</td>
                        <td className="py-4 text-gray-500">{sec.academic_year_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Announcements & Emergency Alerts Tab */}
            {activeTab === "announcements" && (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div key={ann.id} className={`p-6 rounded-2xl border ${ann.is_emergency ? "border-red-200 bg-red-50/50" : "border-gray-100 bg-gray-50"} space-y-2`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-gray-900">{ann.title}</h3>
                        {ann.is_emergency && (
                          <span className="bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                            🚨 WhatsApp Emergency Alert
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-line">{ann.content}</p>
                    <div className="text-xs text-gray-400 pt-2 border-t">By: {ann.author_email}</div>
                  </div>
                ))}
                {announcements.length === 0 && <div className="text-gray-400 text-center py-8">{commonT("noResults")}</div>}
              </div>
            )}
          </>
        )}
      </div>

      {/* School Modal */}
      {showSchoolModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">{commonT("add")} {t("schoolsList")}</h2>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("schoolName")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("schoolCode")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={schoolForm.school_code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, school_code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("directorate")}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={schoolForm.directorate}
                  onChange={(e) => setSchoolForm({ ...schoolForm, directorate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl font-medium"
                >
                  {commonT("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-2xl font-medium"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-900">{t("sendAnnouncement")}</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("schoolName")}</label>
                <select
                  required
                  className="w-full px-4 py-3 border rounded-2xl bg-white"
                  value={announcementForm.school}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, school: Number(e.target.value) })}
                >
                  <option value="">-- Select School --</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("title")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-3 border rounded-2xl"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
                <input
                  type="checkbox"
                  id="is_emergency"
                  className="w-5 h-5 accent-red-600 rounded"
                  checked={announcementForm.is_emergency}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_emergency: e.target.checked })}
                />
                <label htmlFor="is_emergency" className="text-sm font-bold text-red-800 cursor-pointer">
                  {t("emergencyBadge")}
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-2xl font-medium"
                >
                  {commonT("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-2xl font-medium"
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

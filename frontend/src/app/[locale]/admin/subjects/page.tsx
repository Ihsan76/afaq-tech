"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";

interface Subject { id: number; translations: Record<string, { name: string }>; name?: string; icon: string; }

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

export default function AdminSubjectsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name, rtl: l.is_rtl }));
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectTranslations, setSubjectTranslations] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("ar");
  const [nameInput, setNameInput] = useState("");
  const [icon, setIcon] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchSubjects(); }, []);

  useEffect(() => {
    setNameInput(subjectTranslations[selectedLang] || "");
  }, [selectedLang, subjectTranslations]);

  const fetchSubjects = async () => {
    try { const res = await api.get("/academics/subjects/"); setSubjects(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const updateName = (val: string) => {
    setSubjectTranslations(prev => ({ ...prev, [selectedLang]: val }));
    setNameInput(val);
  };

  const resetForm = (open = false) => {
    setSubjectTranslations({}); setSelectedLang("ar"); setNameInput(""); setIcon("");
    setEditingSubject(null); setError(""); setShowForm(open);
  };
  const startEdit = (s: Subject) => {
    const tr: Record<string, string> = {};
    for (const lang of LANGUAGES) if (s.translations?.[lang.code]?.name) tr[lang.code] = s.translations[lang.code].name;
    setSubjectTranslations(tr);
    setSelectedLang("ar"); setNameInput(tr["ar"] || ""); setIcon(s.icon);
    setEditingSubject(s); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTranslations["ar"]?.trim()) { setError("الاسم بالعربية مطلوب"); return; }
    try {
      const translations: Record<string, { name: string }> = {};
      for (const lang of LANGUAGES) {
        if (subjectTranslations[lang.code]?.trim()) translations[lang.code] = { name: subjectTranslations[lang.code].trim() };
      }
      const payload = { translations, icon };
      if (editingSubject) await api.put(`/academics/subjects/${editingSubject.id}/`, payload);
      else await api.post("/academics/subjects/create/", payload);
      resetForm(); fetchSubjects();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/subjects/${id}/`); fetchSubjects(); } catch {}
  };

  const getCurrSubjectName = (s: Subject) => {
    return s.translations?.[locale]?.name || s.translations?.ar?.name || s.name || "";
  };

  const filledCount = LANGUAGES.filter(l => subjectTranslations[l.code]?.trim()).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.subjects")}</h1>
          <button onClick={() => resetForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingSubject ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
                  <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.label} {subjectTranslations[l.code]?.trim() ? "✅" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الاسم ({LANGUAGES.find(l => l.code === selectedLang)?.label})</label>
                  <input type="text" value={nameInput} onChange={(e) => updateName(e.target.value)}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    dir={LANGUAGES.find(l => l.code === selectedLang)?.rtl ? "rtl" : "ltr"} />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(l => (
                  <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${subjectTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                    style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                    onClick={() => setSelectedLang(l.code)}>{l.code} {subjectTranslations[l.code]?.trim() ? "✓" : ""}</span>
                ))}
              </div>

              <div className="grid sm:grid-cols-1 gap-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.icon")}</label>
                  <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder="📚" />
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>تم تعبئة {filledCount} من {LANGUAGES.length} لغات</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={() => resetForm()} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : subjects.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.icon")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.name")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameAr")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {subjects.map((subject) => (
                    <tr key={subject.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-4 text-2xl">{subject.icon}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{getCurrSubjectName(subject)}</td>
                      <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{subject.translations?.ar?.name || "-"}</td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => startEdit(subject)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button onClick={() => handleDelete(subject.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface Subject { id: number; name_ar: string; name_en: string; icon: string; }

export default function AdminSubjectsPage() {
  const t = useTranslations();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => { fetchSubjects(); }, []);

  const fetchSubjects = async () => {
    try { const res = await api.get("/academics/subjects/"); setSubjects(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name_ar: nameAr, name_en: nameEn, icon };
      if (editingSubject) await api.put(`/academics/subjects/${editingSubject.id}/`, payload);
      else await api.post("/academics/subjects/create/", payload);
      resetForm(); fetchSubjects();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/subjects/${id}/`); fetchSubjects(); } catch {}
  };

  const resetForm = () => { setNameAr(""); setNameEn(""); setIcon(""); setEditingSubject(null); setShowForm(false); };
  const startEdit = (s: Subject) => { setNameAr(s.name_ar); setNameEn(s.name_en); setIcon(s.icon); setEditingSubject(s); setShowForm(true); };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.subjects")}</h1>
          <button onClick={() => setShowForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingSubject ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameAr")}</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameEn")}</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.icon")}</label><input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} placeholder="📚" /></div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : subjects.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--color-background-secondary)" }}>
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.icon")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameAr")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameEn")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                {subjects.map((subject) => (
                  <tr key={subject.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="px-6 py-4 text-2xl">{subject.icon}</td>
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{subject.name_ar}</td>
                    <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{subject.name_en}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => startEdit(subject)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                      <button onClick={() => handleDelete(subject.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

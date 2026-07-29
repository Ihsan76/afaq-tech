"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface Grade { id: number; name_ar: string; name_en: string; }
interface Curriculum { id: number; name_ar: string; name_en: string; country: string; year: number; grade: number; }

export default function AdminCurriculaPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [gradeId, setGradeId] = useState<number>(0);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [cRes, gRes] = await Promise.all([api.get("/academics/curricula/"), api.get("/academics/grades/")]);
      setCurricula(cRes.data.results || cRes.data); setGrades(gRes.data.results || gRes.data);
    } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name_ar: nameAr, name_en: nameEn, country, year, grade: gradeId };
      if (editingCurriculum) await api.put(`/academics/curricula/${editingCurriculum.id}/`, payload);
      else await api.post("/academics/curricula/create/", payload);
      resetForm(); fetchData();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/curricula/${id}/`); fetchData(); } catch {}
  };

  const resetForm = () => { setNameAr(""); setNameEn(""); setCountry(""); setYear(new Date().getFullYear()); setGradeId(0); setEditingCurriculum(null); setShowForm(false); };
  const startEdit = (c: Curriculum) => { setNameAr(c.name_ar); setNameEn(c.name_en); setCountry(c.country); setYear(c.year); setGradeId(c.grade); setEditingCurriculum(c); setShowForm(true); };
  const getGradeName = (id: number) => { const g = grades.find((g) => g.id === id); return g ? (locale === "ar" ? g.name_ar : g.name_en || g.name_ar) : "-"; };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.curricula")}</h1>
          <button onClick={() => setShowForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingCurriculum ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameAr")}</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameEn")}</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.country")}</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.year")}</label><input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                <div className="sm:col-span-2"><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.grade")}</label>
                  <select value={gradeId} onChange={(e) => setGradeId(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required>
                    <option value={0}>{t("academy.selectGrade")}</option>
                    {grades.map((g) => (<option key={g.id} value={g.id}>{locale === "ar" ? g.name_ar : g.name_en || g.name_ar}</option>))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : curricula.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--color-background-secondary)" }}>
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameAr")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.country")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.year")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.grade")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                {curricula.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{locale === "ar" ? c.name_ar : c.name_en || c.name_ar}</td>
                    <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{c.country}</td>
                    <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{c.year}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{getGradeName(c.grade)}</span></td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => startEdit(c)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                      <button onClick={() => handleDelete(c.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
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

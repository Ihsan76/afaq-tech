"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { api } from "@/lib/api";

interface Grade { id: number; name_ar: string; name_en: string; level: number; }

export default function AdminGradesPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [level, setLevel] = useState(1);

  useEffect(() => { fetchGrades(); }, []);

  const fetchGrades = async () => {
    try { const res = await api.get("/academics/grades/"); setGrades(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { name_ar: nameAr, name_en: nameEn, level };
      if (editingGrade) await api.put(`/academics/grades/${editingGrade.id}/`, payload);
      else await api.post("/academics/grades/create/", payload);
      resetForm(); fetchGrades();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/grades/${id}/`); fetchGrades(); } catch {}
  };

  const resetForm = () => { setNameAr(""); setNameEn(""); setLevel(1); setEditingGrade(null); setShowForm(false); };
  const startEdit = (g: Grade) => { setNameAr(g.name_ar); setNameEn(g.name_en); setLevel(g.level); setEditingGrade(g); setShowForm(true); };

  const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.grades")}</h1>
          <button onClick={() => setShowForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingGrade ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameAr")}</label><input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.nameEn")}</label><input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.level")}</label><input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required /></div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={resetForm} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : grades.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <table className="w-full">
              <thead style={{ backgroundColor: "var(--color-background-secondary)" }}>
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameAr")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameEn")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.level")}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                {grades.map((grade) => (
                  <tr key={grade.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                    <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{grade.name_ar}</td>
                    <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{grade.name_en}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{grade.level}</span></td>
                    <td className="px-6 py-4 flex gap-3">
                      <button onClick={() => startEdit(grade)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                      <button onClick={() => handleDelete(grade.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
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

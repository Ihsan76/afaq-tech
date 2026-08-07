"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";

interface Grade { id: number; translations: Record<string, { name: string }>; name?: string; level: number; }

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

export default function AdminGradesPage() {
  const t = useTranslations();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name, rtl: l.is_rtl }));
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [gradeTranslations, setGradeTranslations] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("ar");
  const [nameInput, setNameInput] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { fetchGrades(); }, []);

  useEffect(() => {
    setNameInput(gradeTranslations[selectedLang] || "");
  }, [selectedLang, gradeTranslations]);

  const fetchGrades = async () => {
    try { const res = await api.get("/academics/grades/"); setGrades(res.data.results || res.data); } catch {} finally { setIsLoading(false); }
  };

  const updateName = (val: string) => {
    setGradeTranslations(prev => ({ ...prev, [selectedLang]: val }));
    setNameInput(val);
  };

  const resetForm = (open = false) => {
    setGradeTranslations({}); setSelectedLang("ar"); setNameInput(""); setLevel(0);
    setEditingGrade(null); setError(""); setShowForm(open);
  };
  const startEdit = (g: Grade) => {
    const tr: Record<string, string> = {};
    for (const lang of LANGUAGES) if (g.translations?.[lang.code]?.name) tr[lang.code] = g.translations[lang.code].name;
    setGradeTranslations(tr);
    setSelectedLang("ar"); setNameInput(tr["ar"] || ""); setLevel(g.level);
    setEditingGrade(g); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradeTranslations["ar"]?.trim()) { setError("الاسم بالعربية مطلوب"); return; }
    try {
      const translations: Record<string, { name: string }> = {};
      for (const lang of LANGUAGES) {
        if (gradeTranslations[lang.code]?.trim()) translations[lang.code] = { name: gradeTranslations[lang.code].trim() };
      }
      const payload = { translations, level };
      if (editingGrade) await api.put(`/academics/grades/${editingGrade.id}/`, payload);
      else await api.post("/academics/grades/create/", payload);
      resetForm(); fetchGrades();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/grades/${id}/`); fetchGrades(); } catch {}
  };

  const filledCount = LANGUAGES.filter(l => gradeTranslations[l.code]?.trim()).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("academy.grades")}</h1>
          <button onClick={() => resetForm(true)} className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>+ {t("common.add")}</button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingGrade ? t("common.edit") : t("common.add")}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>{t("common.level")}</label>
                  <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
                  <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    {LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.label} {gradeTranslations[l.code]?.trim() ? "✅" : ""}
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
                  <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${gradeTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                    style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                    onClick={() => setSelectedLang(l.code)}>{l.code} {gradeTranslations[l.code]?.trim() ? "✓" : ""}</span>
                ))}
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>تم تعبئة {filledCount} من {LANGUAGES.length} لغات</p>
              <div className="flex gap-3">
                <button type="submit" className="text-white px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>{t("common.save")}</button>
                <button type="button" onClick={() => resetForm()} className="px-6 py-2.5 rounded-xl font-semibold transition-all" style={{ backgroundColor: "var(--color-background-secondary)", color: "var(--color-text-secondary)" }}>{t("common.cancel")}</button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p> : grades.length === 0 ? <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p> : (
          <div className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: "var(--color-surface)" }}>
                  <tr>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.level")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameAr")}</th>
                    <th className="col-hide-md px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.nameEn")}</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                  {grades.sort((a, b) => a.level - b.level).map((grade) => (
                    <tr key={grade.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{grade.level}</td>
                      <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{grade.translations?.ar?.name || "-"}</td>
                      <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{grade.translations?.en?.name || "-"}</td>
                      <td className="px-6 py-4 flex gap-3">
                        <button onClick={() => startEdit(grade)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                        <button onClick={() => handleDelete(grade.id)} className="font-medium text-sm transition-colors" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
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

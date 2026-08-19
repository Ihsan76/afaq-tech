"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";
import SelectDropdown from "@/components/ui/SelectDropdown";

interface Grade {
  id: number;
  level: number;
  has_tracks: boolean;
  translations: Record<string, { name: string }>;
  tracks: Track[];
}

interface Track {
  id: number;
  code: string;
  order: number;
  is_active: boolean;
  grade: number;
  country: string;
  year: number;
  name: string;
  translations: Record<string, { name: string }>;
}

const inputCls = "w-full px-4 py-3 border rounded-2xl focus:ring-2 transition-all";

const TRACK_CODES = [
  { value: "scientific_engineering", label: "علمي / هندسي" },
  { value: "humanities_social", label: "أدبي / إنساني" },
  { value: "business", label: "تجاري" },
  { value: "health", label: "صحي" },
];

export default function AdminTracksPage() {
  const t = useTranslations();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name, rtl: l.is_rtl }));

  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [formGrade, setFormGrade] = useState<number>(0);
  const [formCountry, setFormCountry] = useState<string>("المملكة الأردنية الهاشمية");
  const [formYear, setFormYear] = useState<number>(2026);
  const [formCode, setFormCode] = useState("scientific_engineering");
  const [formOrder, setFormOrder] = useState(0);
  const [formActive, setFormActive] = useState(true);
  const [formTranslations, setFormTranslations] = useState<Record<string, string>>({});
  const [selectedLang, setSelectedLang] = useState("ar");
  const [nameInput, setNameInput] = useState("");

  useEffect(() => { fetchGrades(); }, []);

  useEffect(() => {
    setNameInput(formTranslations[selectedLang] || "");
  }, [selectedLang, formTranslations]);

  const fetchGrades = async () => {
    try {
      const res = await api.get("/academics/grades/");
      setGrades((res.data.results || res.data).sort((a: Grade, b: Grade) => a.level - b.level));
    } catch {} finally { setIsLoading(false); }
  };

  const secondaryGrades = grades.filter((g) => g.has_tracks);

  const updateName = (val: string) => {
    setFormTranslations((prev) => ({ ...prev, [selectedLang]: val }));
    setNameInput(val);
  };

  const resetForm = (open = false) => {
    setFormTranslations({});
    setSelectedLang("ar");
    setNameInput("");
    setFormGrade(secondaryGrades[0]?.id || 0);
    setFormCountry("المملكة الأردنية الهاشمية");
    setFormYear(2026);
    setFormCode("scientific_engineering");
    setFormOrder(0);
    setFormActive(true);
    setEditingTrack(null);
    setError("");
    setShowForm(open);
  };

  const startEdit = (track: Track) => {
    const tr: Record<string, string> = {};
    for (const lang of LANGUAGES) if (track.translations?.[lang.code]?.name) tr[lang.code] = track.translations[lang.code].name;
    setFormTranslations(tr);
    setSelectedLang("ar");
    setNameInput(tr["ar"] || "");
    setFormGrade(track.grade);
    setFormCountry(track.country || "المملكة الأردنية الهاشمية");
    setFormYear(track.year || 2026);
    setFormCode(track.code);
    setFormOrder(track.order);
    setFormActive(track.is_active);
    setEditingTrack(track);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTranslations["ar"]?.trim()) { setError("الاسم بالعربية مطلوب"); return; }
    if (!formGrade) { setError("يرجى اختيار الصف"); return; }
    try {
      const translations: Record<string, { name: string }> = {};
      for (const lang of LANGUAGES) {
        if (formTranslations[lang.code]?.trim()) translations[lang.code] = { name: formTranslations[lang.code].trim() };
      }
      const payload = { translations, grade: formGrade, country: formCountry, year: formYear, code: formCode, order: formOrder, is_active: formActive };
      if (editingTrack) await api.put(`/academics/tracks/${editingTrack.id}/`, payload);
      else await api.post("/academics/tracks/create/", payload);
      resetForm();
      fetchGrades();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    try { await api.delete(`/academics/tracks/${id}/`); fetchGrades(); } catch {}
  };

  const toggleHasTracks = async (grade: Grade) => {
    try { await api.patch(`/academics/grades/${grade.id}/`, { has_tracks: !grade.has_tracks }); fetchGrades(); } catch {}
  };

  const filledCount = LANGUAGES.filter((l) => formTranslations[l.code]?.trim()).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>التخصصات الأكاديمية</h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>إدارة تخصصات المرحلة الثانوية (علمي/هندسي، أدبي، تجاري، صحي)</p>
          </div>
          {secondaryGrades.length > 0 && (
            <button onClick={() => { resetForm(true); setFormGrade(secondaryGrades[0].id); }}
              className="text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)", boxShadow: "var(--btn-shadow)" }}>
              + إضافة تخصص
            </button>
          )}
        </div>

        {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

        {showForm && (
          <div className="rounded-3xl shadow-xl p-6 mb-8" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{editingTrack ? "تعديل تخصص" : "إضافة تخصص جديد"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الدولة</label>
                  <input type="text" value={formCountry} onChange={(e) => setFormCountry(e.target.value)} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>السنة</label>
                  <input type="number" value={formYear} onChange={(e) => setFormYear(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الصف</label>
                  <SelectDropdown value={formGrade} onChange={(v) => setFormGrade(Number(v))}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    <option value={0}>— اختر الصف —</option>
                    {secondaryGrades.map((g) => (
                      <option key={g.id} value={g.id}>صف {g.level}</option>
                    ))}
                  </SelectDropdown>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الكود</label>
                  <SelectDropdown value={formCode} onChange={(v) => setFormCode(String(v))}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    {TRACK_CODES.map((tc) => (
                      <option key={tc.value} value={tc.value}>{tc.label} ({tc.value})</option>
                    ))}
                  </SelectDropdown>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الترتيب</label>
                  <input type="number" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                    <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="w-4 h-4 rounded" />
                    نشط
                  </label>
                </div>
              </div>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>اللغة</label>
                  <SelectDropdown value={selectedLang} onChange={(v) => setSelectedLang(String(v))}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}>
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label} {formTranslations[l.code]?.trim() ? "✅" : ""}</option>
                    ))}
                  </SelectDropdown>
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>الاسم ({LANGUAGES.find((l) => l.code === selectedLang)?.label})</label>
                  <input type="text" value={nameInput} onChange={(e) => updateName(e.target.value)}
                    className={inputCls} style={{ borderColor: "var(--color-border)", color: "var(--color-text)", backgroundColor: "var(--color-background)" }}
                    dir={LANGUAGES.find((l) => l.code === selectedLang)?.rtl ? "rtl" : "ltr"} />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map((l) => (
                  <span key={l.code} className={`px-2 py-1 rounded-lg text-xs font-medium ${formTranslations[l.code]?.trim() ? "" : "opacity-40"}`}
                    style={{ background: selectedLang === l.code ? "var(--color-primary)" : "var(--color-background)", color: selectedLang === l.code ? "#FFF" : "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                    onClick={() => setSelectedLang(l.code)}>{l.code} {formTranslations[l.code]?.trim() ? "✓" : ""}</span>
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

        {isLoading ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.loading")}</p>
        ) : grades.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>{t("common.noResults")}</p>
        ) : (
          <div className="space-y-6">
            {grades.map((grade) => (
              <div key={grade.id} className="rounded-3xl shadow-xl overflow-hidden" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>صف {grade.level}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${grade.has_tracks ? "" : "opacity-50"}`}
                      style={{ background: grade.has_tracks ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)", color: grade.has_tracks ? "#16a34a" : "#6b7280" }}>
                      {grade.has_tracks ? "يحتوي تخصصات" : "بدون تخصصات"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleHasTracks(grade)} className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: grade.has_tracks ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", color: grade.has_tracks ? "var(--color-error)" : "#16a34a" }}>
                      {grade.has_tracks ? "تعطيل التخصصات" : "تفعيل التخصصات"}
                    </button>
                    {grade.has_tracks && (
                      <button onClick={() => { resetForm(true); setFormGrade(grade.id); }}
                        className="text-white px-4 py-1.5 rounded-xl text-sm font-semibold transition-all"
                        style={{ background: "var(--btn-primary-bg)", color: "var(--btn-primary-color)" }}>
                        + تخصص
                      </button>
                    )}
                  </div>
                </div>
                {grade.has_tracks && grade.tracks.length > 0 ? (
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead style={{ background: "var(--color-background)" }}>
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>الترتيب</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>الكود</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>الاسم (عربي)</th>
                          <th className="col-hide-md px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>الاسم (إنجليزي)</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>الحالة</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)" }}>إجراءات</th>
                        </tr>
                      </thead>
                      <tbody style={{ borderTop: "1px solid var(--color-border)" }}>
                        {grade.tracks.sort((a, b) => a.order - b.order).map((track) => (
                          <tr key={track.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                            <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{track.order}</td>
                            <td className="px-6 py-4" style={{ color: "var(--color-text-muted)" }}><code className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--color-background)" }}>{track.code}</code></td>
                            <td className="px-6 py-4 font-medium" style={{ color: "var(--color-text)" }}>{track.name || track.translations?.ar?.name || "-"}</td>
                            <td className="col-hide-md px-6 py-4" style={{ color: "var(--color-text-muted)" }}>{track.translations?.en?.name || "-"}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: track.is_active ? "rgba(34,197,94,0.15)" : "rgba(107,114,128,0.15)", color: track.is_active ? "#16a34a" : "#6b7280" }}>
                                {track.is_active ? "نشط" : "غير نشط"}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex gap-3">
                              <button onClick={() => startEdit(track)} className="font-medium text-sm" style={{ color: "var(--color-primary)" }}>{t("common.edit")}</button>
                              <button onClick={() => handleDelete(track.id)} className="font-medium text-sm" style={{ color: "var(--color-error)" }}>{t("common.delete")}</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : grade.has_tracks ? (
                  <div className="px-6 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                    لا يوجد تخصصات بعد. اضغط &quot;+ تخصص&quot; لإضافة تخصص جديد.
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                    هذا الصف لا يحتوي تخصصات. اضغط &quot;تفعيل التخصصات&quot; لتفعيلها.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

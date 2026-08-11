"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useLanguages } from "@/lib/useLanguages";
import SelectDropdown from "@/components/ui/SelectDropdown";

// ---- Types ----

interface PromptTemplate {
  id: number; name: string; feature_key: string; language: string;
  learner_stage: string; subject: number | null; curriculum: number | null;
  template_body: string; user_message_template: string;
  priority: number; is_default: boolean;
  is_active: boolean; version: number; updated_at: string;
}

interface GradePromptProfile {
  id: number; grade: number; grade_name: string;
  learner_stage: string; language_guidance: string;
  content_depth_guidance: string; activity_guidance: string;
  materials_guidance: string; assessment_guidance: string;
  forbidden_terms: string[]; discouraged_patterns: string[];
  extra_instructions: string[]; is_active: boolean;
  subject_profiles: SubjectPromptProfile[];
  updated_at?: string;
}

interface SubjectPromptProfile {
  id: number; grade_profile: number; subject: number;
  subject_name: string; language_guidance: string;
  content_depth_guidance: string; activity_guidance: string;
  materials_guidance: string; assessment_guidance: string;
  forbidden_terms: string[]; discouraged_patterns: string[];
  extra_instructions: string[]; topic_rules: string;
  override_language_guidance: boolean;
  override_content_depth_guidance: boolean;
  override_activity_guidance: boolean;
  override_materials_guidance: boolean;
  override_assessment_guidance: boolean;
  merge_forbidden_terms: boolean;
  merge_discouraged_patterns: boolean;
  merge_extra_instructions: boolean;
  is_active: boolean;
}

type Tab = "templates" | "grade-profiles" | "subject-profiles";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "templates", label: "قوالب البرومبت", icon: "📝" },
  { key: "grade-profiles", label: "بروفايلات الصفوف", icon: "🎓" },
  { key: "subject-profiles", label: "بروفايلات المواد", icon: "📚" },
];

const FEATURE_KEYS = ["lesson_plan", "refine", "assistant", "worksheet", "homework"];
const STAGES = [
  { value: "", label: "الكل" }, { value: "early_primary", label: "المرحلة المبكرة" },
  { value: "primary", label: "ابتدائي" }, { value: "middle", label: "متوسط" },
  { value: "secondary", label: "ثانوي" }, { value: "university", label: "جامعي" },
  { value: "professional", label: "مهني" },
];

const inputCls = "w-full px-3 py-2 rounded-xl text-sm outline-none transition-all";
const labelCls = "block text-xs font-medium mb-1";
const fieldBg = { background: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" };
const surface = { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" };

// ---- Helper Components ----

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6" style={surface} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-80" style={{ color: "var(--color-text-muted)" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className={labelCls} style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

// ---- Main Page ----

export default function AdminPromptsPage() {
  const t = useTranslations();
  const { languages } = useLanguages();
  const LANGUAGES = languages.map((l) => ({ code: l.code, label: l.native_name || l.name }));
  const [tab, setTab] = useState<Tab>("templates");

  // Shared
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Templates state
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [langFilter, setLangFilter] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
  const [tf, setTf] = useState({ name: "", feature_key: "lesson_plan", language: "ar", learner_stage: "", subject: "", curriculum: "", template_body: "", user_message_template: "", priority: 0, is_default: false, is_active: true, version: 1 });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Grade profiles state
  const [gradeProfiles, setGradeProfiles] = useState<GradePromptProfile[]>([]);
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradePromptProfile | null>(null);
  const [gf, setGf] = useState({ grade: "", learner_stage: "", language_guidance: "", content_depth_guidance: "", activity_guidance: "", materials_guidance: "", assessment_guidance: "", forbidden_terms: "", discouraged_patterns: "", extra_instructions: "", is_active: true });
  const [savingGrade, setSavingGrade] = useState(false);
  const [grades, setGrades] = useState<{ id: number; label: string }[]>([]);

  // Subject profiles state
  const [subjectProfiles, setSubjectProfiles] = useState<SubjectPromptProfile[]>([]);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectPromptProfile | null>(null);
  const [sf, setSf] = useState({ grade_profile: "", subject: "", language_guidance: "", content_depth_guidance: "", activity_guidance: "", materials_guidance: "", assessment_guidance: "", forbidden_terms: "", discouraged_patterns: "", extra_instructions: "", topic_rules: "", override_language_guidance: false, override_content_depth_guidance: false, override_activity_guidance: false, override_materials_guidance: false, override_assessment_guidance: false, merge_forbidden_terms: true, merge_discouraged_patterns: true, merge_extra_instructions: true, is_active: true });
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjects, setSubjects] = useState<{ id: number; label: string }[]>([]);

  const loadGrades = async () => {
    try {
      const { data } = await api.get("/academics/grades/");
      const list = data?.results ?? data ?? [];
      setGrades(list.map((g: any) => ({ id: g.id, label: g.translations?.ar?.name || g.translations?.en?.name || g.level?.toString() || `Grade ${g.id}` })));
    } catch {}
  };

  const loadSubjects = async () => {
    try {
      const { data } = await api.get("/academics/subjects/");
      const list = data?.results ?? data ?? [];
      setSubjects(list.map((s: any) => ({ id: s.id, label: s.translations?.ar?.name || s.translations?.en?.name || s.icon || `Subject ${s.id}` })));
    } catch {}
  };

  // ---- Data Loading ----

  const loadTemplates = async () => {
    try {
      const { data } = await api.get("/ai/admin/prompt-templates/");
      setTemplates(data?.results ?? data ?? []);
    } catch {}
  };

  const loadGradeProfiles = async () => {
    try {
      const { data } = await api.get("/ai/admin/grade-prompt-profiles/");
      setGradeProfiles(data?.results ?? data ?? []);
    } catch {}
  };

  const loadSubjectProfiles = async () => {
    try {
      const { data } = await api.get("/ai/admin/subject-prompt-profiles/");
      setSubjectProfiles(data?.results ?? data ?? []);
    } catch {}
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadTemplates(), loadGradeProfiles(), loadSubjectProfiles(), loadGrades(), loadSubjects()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  // ---- Template CRUD ----

  const openTemplateCreate = () => {
    setEditingTemplate(null);
    setTf({ name: "", feature_key: "lesson_plan", language: "ar", learner_stage: "", subject: "", curriculum: "", template_body: "", user_message_template: "", priority: 0, is_default: false, is_active: true, version: 1 });
    setError(""); setShowTemplateForm(true);
  };

  const openTemplateEdit = (t: PromptTemplate) => {
    setEditingTemplate(t);
    setTf({ name: t.name, feature_key: t.feature_key, language: t.language, learner_stage: t.learner_stage, subject: t.subject?.toString() || "", curriculum: t.curriculum?.toString() || "", template_body: t.template_body, user_message_template: t.user_message_template, priority: t.priority, is_default: t.is_default, is_active: t.is_active, version: t.version });
    setError(""); setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (!tf.name.trim() || !tf.template_body.trim()) { setError("الاسم ومحتوى القالب مطلوبان"); return; }
    setSavingTemplate(true); setError("");
    try {
      const payload = { ...tf, subject: tf.subject ? Number(tf.subject) : null, curriculum: tf.curriculum ? Number(tf.curriculum) : null, priority: Number(tf.priority), version: Number(tf.version) };
      if (editingTemplate) {
        await api.put(`/ai/admin/prompt-templates/${editingTemplate.id}/`, payload);
      } else {
        await api.post("/ai/admin/prompt-templates/", payload);
      }
      setShowTemplateForm(false); await loadTemplates();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
    finally { setSavingTemplate(false); }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm("تأكيد حذف قالب البرومبت؟")) return;
    try { await api.delete(`/ai/admin/prompt-templates/${id}/`); await loadTemplates(); }
    catch { setError("فشل الحذف"); }
  };

  // ---- Grade Profile CRUD ----

  const openGradeCreate = () => {
    setEditingGrade(null);
    setGf({ grade: "", learner_stage: "", language_guidance: "", content_depth_guidance: "", activity_guidance: "", materials_guidance: "", assessment_guidance: "", forbidden_terms: "", discouraged_patterns: "", extra_instructions: "", is_active: true });
    setError(""); setShowGradeForm(true);
  };

  const openGradeEdit = (p: GradePromptProfile) => {
    setEditingGrade(p);
    setGf({ grade: p.grade.toString(), learner_stage: p.learner_stage, language_guidance: p.language_guidance, content_depth_guidance: p.content_depth_guidance, activity_guidance: p.activity_guidance, materials_guidance: p.materials_guidance, assessment_guidance: p.assessment_guidance, forbidden_terms: (p.forbidden_terms || []).join("\n"), discouraged_patterns: (p.discouraged_patterns || []).join("\n"), extra_instructions: (p.extra_instructions || []).join("\n"), is_active: p.is_active });
    setError(""); setShowGradeForm(true);
  };

  const handleSaveGrade = async () => {
    if (!gf.grade) { setError("يرجى اختيار الصف"); return; }
    setSavingGrade(true); setError("");
    try {
      const payload = {
        grade: Number(gf.grade),
        learner_stage: gf.learner_stage,
        language_guidance: gf.language_guidance,
        content_depth_guidance: gf.content_depth_guidance,
        activity_guidance: gf.activity_guidance,
        materials_guidance: gf.materials_guidance,
        assessment_guidance: gf.assessment_guidance,
        forbidden_terms: gf.forbidden_terms.split("\n").filter(Boolean),
        discouraged_patterns: gf.discouraged_patterns.split("\n").filter(Boolean),
        extra_instructions: gf.extra_instructions.split("\n").filter(Boolean),
        is_active: gf.is_active,
      };
      if (editingGrade) {
        await api.put(`/ai/admin/grade-prompt-profiles/${editingGrade.id}/`, payload);
      } else {
        await api.post("/ai/admin/grade-prompt-profiles/", payload);
      }
      setShowGradeForm(false); await loadGradeProfiles();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
    finally { setSavingGrade(false); }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!confirm("تأكيد حذف بروفايل الصف؟")) return;
    try { await api.delete(`/ai/admin/grade-prompt-profiles/${id}/`); await loadGradeProfiles(); }
    catch { setError("فشل الحذف"); }
  };

  // ---- Subject Profile CRUD ----

  const openSubjectCreate = () => {
    setEditingSubject(null);
    setSf({ grade_profile: "", subject: "", language_guidance: "", content_depth_guidance: "", activity_guidance: "", materials_guidance: "", assessment_guidance: "", forbidden_terms: "", discouraged_patterns: "", extra_instructions: "", topic_rules: "", override_language_guidance: false, override_content_depth_guidance: false, override_activity_guidance: false, override_materials_guidance: false, override_assessment_guidance: false, merge_forbidden_terms: true, merge_discouraged_patterns: true, merge_extra_instructions: true, is_active: true });
    setError(""); setShowSubjectForm(true);
  };

  const openSubjectEdit = (p: SubjectPromptProfile) => {
    setEditingSubject(p);
    setSf({
      grade_profile: p.grade_profile.toString(), subject: p.subject.toString(),
      language_guidance: p.language_guidance, content_depth_guidance: p.content_depth_guidance,
      activity_guidance: p.activity_guidance, materials_guidance: p.materials_guidance,
      assessment_guidance: p.assessment_guidance,
      forbidden_terms: (p.forbidden_terms || []).join("\n"),
      discouraged_patterns: (p.discouraged_patterns || []).join("\n"),
      extra_instructions: (p.extra_instructions || []).join("\n"),
      topic_rules: p.topic_rules,
      override_language_guidance: p.override_language_guidance,
      override_content_depth_guidance: p.override_content_depth_guidance,
      override_activity_guidance: p.override_activity_guidance,
      override_materials_guidance: p.override_materials_guidance,
      override_assessment_guidance: p.override_assessment_guidance,
      merge_forbidden_terms: p.merge_forbidden_terms,
      merge_discouraged_patterns: p.merge_discouraged_patterns,
      merge_extra_instructions: p.merge_extra_instructions,
      is_active: p.is_active,
    });
    setError(""); setShowSubjectForm(true);
  };

  const handleSaveSubject = async () => {
    if (!sf.grade_profile || !sf.subject) { setError("يرجى اختيار بروفايل الصف والمادة"); return; }
    setSavingSubject(true); setError("");
    try {
      const payload = {
        ...sf,
        grade_profile: Number(sf.grade_profile),
        subject: Number(sf.subject),
        forbidden_terms: sf.forbidden_terms.split("\n").filter(Boolean),
        discouraged_patterns: sf.discouraged_patterns.split("\n").filter(Boolean),
        extra_instructions: sf.extra_instructions.split("\n").filter(Boolean),
      };
      if (editingSubject) {
        await api.put(`/ai/admin/subject-prompt-profiles/${editingSubject.id}/`, payload);
      } else {
        await api.post("/ai/admin/subject-prompt-profiles/", payload);
      }
      setShowSubjectForm(false); await loadSubjectProfiles();
      await loadGradeProfiles();
    } catch (e: any) { setError(e.response?.data ? JSON.stringify(e.response.data) : "حدث خطأ"); }
    finally { setSavingSubject(false); }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!confirm("تأكيد حذف بروفايل المادة؟")) return;
    try { await api.delete(`/ai/admin/subject-prompt-profiles/${id}/`); await loadSubjectProfiles(); await loadGradeProfiles(); }
    catch { setError("فشل الحذف"); }
  };

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20" style={{ color: "var(--color-text-muted)" }}>
        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        <span>جار التحميل...</span>
      </div>
    );
  }

  const tabContent = (label: string, icon: string) => (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>إدارة البرومبتات</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>إدارة قوالب البرومبت وبروفايلات الصفوف والمواد</p>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-error)" }}>{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "var(--color-primary)" : "transparent",
              color: tab === t.key ? "#FFFFFF" : "var(--color-text-secondary)",
            }}
          >
            {tabContent(t.label, t.icon)}
          </button>
        ))}
      </div>

      {/* ===== TEMPLATES TAB ===== */}
      {tab === "templates" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1" />
            <SelectDropdown className={inputCls + " w-40"} style={fieldBg} value={langFilter} onChange={(v) => setLangFilter(String(v))}>
              <option value="">كل اللغات</option>
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </SelectDropdown>
            <button onClick={openTemplateCreate}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "var(--color-primary)" }}>
              + إضافة قالب
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-2xl" style={surface}>
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                  <th className="p-3 text-right font-semibold">الاسم</th>
                  <th className="col-hide-md p-3 text-right font-semibold">الميزة</th>
                  <th className="p-3 text-right font-semibold">اللغة</th>
                  <th className="col-hide-md p-3 text-right font-semibold">المرحلة</th>
                  <th className="col-hide-sm p-3 text-right font-semibold">الأولوية</th>
                  <th className="col-hide-sm p-3 text-right font-semibold">افتراضي</th>
                  <th className="p-3 text-right font-semibold">نشط</th>
                  <th className="col-hide-sm p-3 text-right font-semibold">الإصدار</th>
                  <th className="p-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {(langFilter ? templates.filter(t => t.language === langFilter) : templates).length === 0 ? (
                  <tr><td colSpan={9} className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>لا توجد قوالب بعد</td></tr>
                ) : (langFilter ? templates.filter(t => t.language === langFilter) : templates).map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="p-3 font-medium">{t.name}</td>
                    <td className="col-hide-md p-3">{t.feature_key}</td>
                    <td className="p-3">{LANGUAGES.find(l => l.code === t.language)?.label || t.language}</td>
                    <td className="col-hide-md p-3">{STAGES.find(s => s.value === t.learner_stage)?.label || t.learner_stage}</td>
                    <td className="col-hide-sm p-3">{t.priority}</td>
                    <td className="col-hide-sm p-3">{t.is_default ? "✅" : "❌"}</td>
                    <td className="p-3">{t.is_active ? "✅" : "❌"}</td>
                    <td className="col-hide-sm p-3">{t.version}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openTemplateEdit(t)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-primary)", color: "#FFFFFF" }}>تعديل</button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-error)", color: "#FFFFFF" }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Template modal */}
          <Modal open={showTemplateForm} onClose={() => setShowTemplateForm(false)} title={editingTemplate ? "تعديل قالب برومبت" : "إضافة قالب برومبت"}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="الاسم"><input className={inputCls} style={fieldBg} value={tf.name} onChange={(e) => setTf({ ...tf, name: e.target.value })} placeholder="اسم القالب" /></Field>
              <Field label="الميزة">
                <SelectDropdown className={inputCls} style={fieldBg} value={tf.feature_key} onChange={(v) => setTf({ ...tf, feature_key: String(v) })}>
                  {FEATURE_KEYS.map(fk => <option key={fk} value={fk}>{fk}</option>)}
                </SelectDropdown>
              </Field>
              <Field label="اللغة">
                <SelectDropdown className={inputCls} style={fieldBg} value={tf.language} onChange={(v) => setTf({ ...tf, language: String(v) })}>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </SelectDropdown>
              </Field>
              <Field label="المرحلة التعليمية">
                <SelectDropdown className={inputCls} style={fieldBg} value={tf.learner_stage} onChange={(v) => setTf({ ...tf, learner_stage: String(v) })}>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </SelectDropdown>
              </Field>
              <Field label="الأولوية"><input type="number" className={inputCls} style={fieldBg} value={tf.priority} onChange={(e) => setTf({ ...tf, priority: Number(e.target.value) })} /></Field>
              <Field label="الإصدار"><input type="number" className={inputCls} style={fieldBg} value={tf.version} onChange={(e) => setTf({ ...tf, version: Number(e.target.value) })} /></Field>
              <Field label="افتراضي">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tf.is_default} onChange={(e) => setTf({ ...tf, is_default: e.target.checked })} /> نعم</label>
              </Field>
              <Field label="نشط">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={tf.is_active} onChange={(e) => setTf({ ...tf, is_active: e.target.checked })} /> نعم</label>
              </Field>
            </div>
            <Field label="محتوى القالب">
              <textarea className={inputCls + " min-h-[200px] font-mono text-xs"} style={fieldBg} value={tf.template_body}
                onChange={(e) => setTf({ ...tf, template_body: e.target.value })} placeholder="محتوى البرومبت..." />
            </Field>
            <Field label="رسالة المستخدم">
              <textarea className={inputCls + " min-h-[80px] font-mono text-xs"} style={fieldBg} value={tf.user_message_template}
                onChange={(e) => setTf({ ...tf, user_message_template: e.target.value })} placeholder="رسالة قصيرة تُرسل مع البرومبت... (اختياري)" />
            </Field>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTemplateForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--color-background)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>إلغاء</button>
              <button onClick={handleSaveTemplate} disabled={savingTemplate}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>{savingTemplate ? "جار الحفظ..." : "حفظ"}</button>
            </div>
          </Modal>
        </div>
      )}

      {/* ===== GRADE PROFILES TAB ===== */}
      {tab === "grade-profiles" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openGradeCreate}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "var(--color-primary)" }}>
              + إضافة بروفايل صف
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-2xl" style={surface}>
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                  <th className="p-3 text-right font-semibold">الصف</th>
                  <th className="col-hide-md p-3 text-right font-semibold">المرحلة</th>
                  <th className="p-3 text-right font-semibold">نشط</th>
                  <th className="col-hide-md p-3 text-right font-semibold">آخر تحديث</th>
                  <th className="p-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {gradeProfiles.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>لا توجد بروفايلات صفوف بعد</td></tr>
                ) : gradeProfiles.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="p-3 font-medium">{p.grade_name}</td>
                    <td className="col-hide-md p-3">{STAGES.find(s => s.value === p.learner_stage)?.label || p.learner_stage}</td>
                    <td className="p-3">{p.is_active ? "✅" : "❌"}</td>
                    <td className="col-hide-md p-3">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openGradeEdit(p)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-primary)", color: "#FFFFFF" }}>تعديل</button>
                        <button onClick={() => handleDeleteGrade(p.id)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-error)", color: "#FFFFFF" }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grade Profile Form */}
          <Modal open={showGradeForm} onClose={() => setShowGradeForm(false)} title={editingGrade ? "تعديل بروفايل الصف" : "إضافة بروفايل الصف"}>
            <Field label="الصف">
              <SelectDropdown className={inputCls} style={fieldBg} value={gf.grade} onChange={(v) => setGf({ ...gf, grade: String(v) })}>
                <option value="">اختر الصف</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
              </SelectDropdown>
            </Field>
            <Field label="المرحلة التعليمية">
              <SelectDropdown className={inputCls} style={fieldBg} value={gf.learner_stage} onChange={(v) => setGf({ ...gf, learner_stage: String(v) })}>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </SelectDropdown>
            </Field>
            <Field label="نشط">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={gf.is_active} onChange={(e) => setGf({ ...gf, is_active: e.target.checked })} /> نعم</label>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="توجيهات اللغة"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.language_guidance} onChange={(e) => setGf({ ...gf, language_guidance: e.target.value })} /></Field>
              <Field label="توجيهات عمق المحتوى"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.content_depth_guidance} onChange={(e) => setGf({ ...gf, content_depth_guidance: e.target.value })} /></Field>
              <Field label="توجيهات الأنشطة"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.activity_guidance} onChange={(e) => setGf({ ...gf, activity_guidance: e.target.value })} /></Field>
              <Field label="توجيهات المواد"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.materials_guidance} onChange={(e) => setGf({ ...gf, materials_guidance: e.target.value })} /></Field>
              <Field label="توجيهات التقييم"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.assessment_guidance} onChange={(e) => setGf({ ...gf, assessment_guidance: e.target.value })} /></Field>
            </div>
            <Field label="المصطلحات الممنوعة (سطر لكل مصطلح)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.forbidden_terms} onChange={(e) => setGf({ ...gf, forbidden_terms: e.target.value })} /></Field>
            <Field label="الأنماط غير المرغوب فيها (سطر لكل نمط)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.discouraged_patterns} onChange={(e) => setGf({ ...gf, discouraged_patterns: e.target.value })} /></Field>
            <Field label="تعليمات إضافية (سطر لكل تعليمة)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={gf.extra_instructions} onChange={(e) => setGf({ ...gf, extra_instructions: e.target.value })} /></Field>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGradeForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--color-background)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>إلغاء</button>
              <button onClick={handleSaveGrade} disabled={savingGrade}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>{savingGrade ? "جار الحفظ..." : "حفظ"}</button>
            </div>
          </Modal>
        </div>
      )}

      {/* ===== SUBJECT PROFILES TAB ===== */}
      {tab === "subject-profiles" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openSubjectCreate}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "var(--color-primary)" }}>
              + إضافة بروفايل مادة
            </button>
          </div>
          <div className="overflow-auto max-h-[400px] rounded-2xl" style={surface}>
            <table className="w-full text-sm">
              <thead>
                <tr className="sticky top-0" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                  <th className="p-3 text-right font-semibold">بروفايل الصف</th>
                  <th className="p-3 text-right font-semibold">المادة</th>
                  <th className="p-3 text-right font-semibold">نشط</th>
                  <th className="p-3 text-right font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {subjectProfiles.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center" style={{ color: "var(--color-text-muted)" }}>لا توجد بروفايلات مواد بعد</td></tr>
                ) : subjectProfiles.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="p-3 font-medium">{p.grade_profile}</td>
                    <td className="p-3">{p.subject_name}</td>
                    <td className="p-3">{p.is_active ? "✅" : "❌"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button onClick={() => openSubjectEdit(p)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-primary)", color: "#FFFFFF" }}>تعديل</button>
                        <button onClick={() => handleDeleteSubject(p.id)} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "var(--color-error)", color: "#FFFFFF" }}>حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subject Profile Form */}
          <Modal open={showSubjectForm} onClose={() => setShowSubjectForm(false)} title={editingSubject ? "تعديل بروفايل المادة" : "إضافة بروفايل المادة"}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="بروفايل الصف">
                <SelectDropdown className={inputCls} style={fieldBg} value={sf.grade_profile} onChange={(v) => setSf({ ...sf, grade_profile: String(v) })}>
                  <option value="">اختر بروفايل الصف</option>
                  {gradeProfiles.map(gp => <option key={gp.id} value={gp.id}>{gp.grade_name}</option>)}
                </SelectDropdown>
              </Field>
              <Field label="المادة">
                <SelectDropdown className={inputCls} style={fieldBg} value={sf.subject} onChange={(v) => setSf({ ...sf, subject: String(v) })}>
                  <option value="">اختر المادة</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </SelectDropdown>
              </Field>
              <Field label="نشط">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.is_active} onChange={(e) => setSf({ ...sf, is_active: e.target.checked })} /> نعم</label>
              </Field>
            </div>

            <h3 className="text-sm font-bold mt-4 mb-2" style={{ color: "var(--color-text)" }}>تجاوز التوجيهات</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="تجاوز توجيهات اللغة">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.override_language_guidance} onChange={(e) => setSf({ ...sf, override_language_guidance: e.target.checked })} /> تفعيل</label>
              </Field>
              <Field label="تجاوز توجيهات العمق">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.override_content_depth_guidance} onChange={(e) => setSf({ ...sf, override_content_depth_guidance: e.target.checked })} /> تفعيل</label>
              </Field>
              <Field label="تجاوز توجيهات الأنشطة">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.override_activity_guidance} onChange={(e) => setSf({ ...sf, override_activity_guidance: e.target.checked })} /> تفعيل</label>
              </Field>
              <Field label="تجاوز توجيهات المواد">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.override_materials_guidance} onChange={(e) => setSf({ ...sf, override_materials_guidance: e.target.checked })} /> تفعيل</label>
              </Field>
              <Field label="تجاوز توجيهات التقييم">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.override_assessment_guidance} onChange={(e) => setSf({ ...sf, override_assessment_guidance: e.target.checked })} /> تفعيل</label>
              </Field>
            </div>

            <h3 className="text-sm font-bold mt-4 mb-2" style={{ color: "var(--color-text)" }}>إعدادات الدمج</h3>
            <div className="grid grid-cols-3 gap-4">
              <Field label="دمج المصطلحات الممنوعة">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.merge_forbidden_terms} onChange={(e) => setSf({ ...sf, merge_forbidden_terms: e.target.checked })} /> دمج</label>
              </Field>
              <Field label="دمج الأنماط غير المرغوب فيها">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.merge_discouraged_patterns} onChange={(e) => setSf({ ...sf, merge_discouraged_patterns: e.target.checked })} /> دمج</label>
              </Field>
              <Field label="دمج التعليمات الإضافية">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sf.merge_extra_instructions} onChange={(e) => setSf({ ...sf, merge_extra_instructions: e.target.checked })} /> دمج</label>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <Field label="قواعد الموضوع"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.topic_rules} onChange={(e) => setSf({ ...sf, topic_rules: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="توجيهات اللغة"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.language_guidance} onChange={(e) => setSf({ ...sf, language_guidance: e.target.value })} /></Field>
              <Field label="توجيهات عمق المحتوى"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.content_depth_guidance} onChange={(e) => setSf({ ...sf, content_depth_guidance: e.target.value })} /></Field>
              <Field label="توجيهات الأنشطة"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.activity_guidance} onChange={(e) => setSf({ ...sf, activity_guidance: e.target.value })} /></Field>
              <Field label="توجيهات المواد"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.materials_guidance} onChange={(e) => setSf({ ...sf, materials_guidance: e.target.value })} /></Field>
              <Field label="توجيهات التقييم"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.assessment_guidance} onChange={(e) => setSf({ ...sf, assessment_guidance: e.target.value })} /></Field>
            </div>
            <Field label="المصطلحات الممنوعة (سطر لكل مصطلح)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.forbidden_terms} onChange={(e) => setSf({ ...sf, forbidden_terms: e.target.value })} /></Field>
            <Field label="الأنماط غير المرغوب فيها (سطر لكل نمط)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.discouraged_patterns} onChange={(e) => setSf({ ...sf, discouraged_patterns: e.target.value })} /></Field>
            <Field label="تعليمات إضافية (سطر لكل تعليمة)"><textarea className={inputCls + " min-h-[80px]"} style={fieldBg} value={sf.extra_instructions} onChange={(e) => setSf({ ...sf, extra_instructions: e.target.value })} /></Field>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSubjectForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--color-background)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>إلغاء</button>
              <button onClick={handleSaveSubject} disabled={savingSubject}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}>{savingSubject ? "جار الحفظ..." : "حفظ"}</button>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}

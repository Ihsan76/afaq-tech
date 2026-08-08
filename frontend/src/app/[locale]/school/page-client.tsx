"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import FadeIn from "@/components/FadeIn";

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

interface Ticket {
  id: number;
  parent: number;
  parent_email?: string;
  teacher: number;
  teacher_email?: string;
  student: number;
  student_email?: string;
  subject: number | null;
  title: string;
  status: string;
  messages: Array<{ sender: string; role: string; text: string; timestamp: string }>;
}

interface Person {
  id: number;
  email: string;
  name: string;
}

interface Attachment {
  id: number;
  uploader: number;
  uploader_email: string;
  uploader_name: string;
  section: number | null;
  section_name?: string;
  kind: string;
  kind_display: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  review_status: string;
  review_notes: string;
  created_at: string;
}

interface Attendance {
  id: number;
  student: number;
  student_email: string;
  student_name: string;
  section: number;
  section_name?: string;
  school: number;
  school_name?: string;
  date: string;
  status: string;
  status_display: string;
  recorded_by?: number | null;
  recorded_by_email?: string;
  notes?: string;
  created_at: string;
}

interface MyContext {
  role: string;
  sections: Section[];
  announcements: Announcement[];
  tickets: Ticket[];
  teachers: Person[];
  students: Person[];
  attachments: Attachment[];
  attendance: Attendance[];
  ai_settings?: {
    language_complexity: string;
    tone_preference: string;
    voice_type: string;
    context_retrieval: boolean;
  };
}

const ROLE_ICONS: Record<string, string> = {
  student: "🎓",
  teacher: "👨‍🏫",
  admin: "👑",
  creator: "✍️",
};

export default function SchoolFollowUpPage() {
  const t = useTranslations("schools");
  const commonT = useTranslations("common");
  const navT = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const currentLocale = pathname.split("/")[1] || "en";
  const { user, isLoading, loadUser } = useAuthStore();
  const loadedRef = useRef(false);

  const [context, setContext] = useState<MyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"announcements" | "tickets" | "ai" | "attachments" | "attendance">("announcements");

  // Ticket modal state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ teacher: 0, student: 0, subject: "", title: "" });
  const [sending, setSending] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [sendingReply, setSendingReply] = useState<number | null>(null);

  // AI settings state
  const [aiForm, setAiForm] = useState({ language_complexity: "simple", tone_preference: "friendly", voice_type: "default", context_retrieval: true });
  const [savingAi, setSavingAi] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  // Voice state
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechText, setSpeechText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Attachment upload state
  const [attachmentForm, setAttachmentForm] = useState({ kind: "lesson", section: 0, title: "", description: "" });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});
  const [reviewing, setReviewing] = useState<number | null>(null);

  // Attendance state
  const [attendanceSection, setAttendanceSection] = useState(0);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [attendanceRows, setAttendanceRows] = useState<Array<{ student: number; email: string; name: string; status: "present" | "absent" }>>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState("");

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [loadUser]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.get("/schools/my-context/")
      .then((r) => {
        setContext(r.data);
        if (r.data.ai_settings) {
          setAiForm(r.data.ai_settings);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex items-center gap-3" style={{ color: "var(--color-text-muted)" }}>
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <span className="text-lg">{commonT("loading")}</span>
        </div>
      </div>
    );
  }

  if (!user) return <SchoolMarketingPage />;

  const roleKey = `role${(user.role || "student").charAt(0).toUpperCase() + (user.role || "student").slice(1)}` as const;
  const openTickets = context?.tickets.filter((tk) => tk.status === "open" || tk.status === "in_progress").length || 0;
  const emergencyCount = context?.announcements.filter((a) => a.is_emergency).length || 0;

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/schools/tickets/", {
        ...ticketForm,
        subject: ticketForm.subject ? Number(ticketForm.subject) : null,
      });
      setShowTicketModal(false);
      setTicketForm({ teacher: 0, student: 0, subject: "", title: "" });
      const r = await api.get("/schools/my-context/");
      setContext(r.data);
    } catch {
      alert("Error creating ticket");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (ticketId: number) => {
    const text = replyText[ticketId]?.trim();
    if (!text) return;
    setSendingReply(ticketId);
    try {
      await api.post(`/schools/tickets/${ticketId}/add_message/`, { message: text });
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
      const r = await api.get("/schools/my-context/");
      setContext(r.data);
    } catch {
      alert("Error sending message");
    } finally {
      setSendingReply(null);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    setAiSaved(false);
    try {
      await api.put("/schools/user/settings/", aiForm);
      setAiSaved(true);
      setTimeout(() => setAiSaved(false), 2500);
    } catch {
      alert("Error saving settings");
    } finally {
      setSavingAi(false);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      alert(t("speechNotSupported"));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        await transcribeBlob(blob);
      };
      mediaRecorder.start();
      setRecording(true);
      setTranscription("");
    } catch {
      alert(t("speechNotSupported"));
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await api.post("/schools/voice/transcribe/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranscription(res.data.text || "");
    } catch {
      alert(t("noAudio"));
    } finally {
      setTranscribing(false);
    }
  };

  const handleSynthesize = async () => {
    if (!speechText.trim()) return;
    try {
      await api.post("/schools/voice/synthesize/", { text: speechText });
    } catch {
      alert("Error");
    }
  };

  const refreshContext = async () => {
    const r = await api.get("/schools/my-context/");
    setContext(r.data);
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachmentFile) {
      alert(t("chooseFile"));
      return;
    }
    setUploading(true);
    setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("kind", attachmentForm.kind);
      formData.append("title", attachmentForm.title);
      formData.append("description", attachmentForm.description);
      if (attachmentForm.section) formData.append("section", String(attachmentForm.section));
      formData.append("file", attachmentFile);
      await api.post("/schools/attachments/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadMsg(t("uploadSuccess"));
      setAttachmentForm({ kind: "lesson", section: 0, title: "", description: "" });
      setAttachmentFile(null);
      await refreshContext();
    } catch {
      alert(t("uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleReviewAttachment = async (id: number, status: string) => {
    setReviewing(id);
    try {
      await api.post(`/schools/attachments/${id}/review/`, {
        review_status: status,
        review_notes: reviewNotes[id] || "",
      });
      await refreshContext();
    } catch {
      alert("Error updating review");
    } finally {
      setReviewing(null);
    }
  };

  const loadAttendance = async () => {
    if (!attendanceSection) return;
    setAttendanceLoading(true);
    setAttendanceMsg("");
    try {
      const [enrR, attR] = await Promise.all([
        api.get("/schools/enrollments/", { params: { section: attendanceSection } }),
        api.get("/schools/attendances/", { params: { section: attendanceSection, date: attendanceDate } }),
      ]);
      const enrollments = enrR.data.results || [];
      const existing = new Map<number, string>();
      (attR.data.results || []).forEach((a: Attendance) => existing.set(a.student, a.status));
      const nameById = new Map((context?.students || []).map((s) => [s.id, s.name]));
      setAttendanceRows(
        enrollments.map((enr: { student: number; student_email: string }) => ({
          student: enr.student,
          email: enr.student_email,
          name: nameById.get(enr.student) || enr.student_email,
          status: (existing.get(enr.student) as "present" | "absent") || "present",
        })),
      );
    } catch {
      alert(t("attendanceLoadError"));
    } finally {
      setAttendanceLoading(false);
    }
  };

  const submitAttendance = async () => {
    if (!attendanceSection || attendanceRows.length === 0) return;
    setAttendanceSaving(true);
    setAttendanceMsg("");
    try {
      const records = attendanceRows.map((r) => ({ student: r.student, status: r.status }));
      await api.post("/schools/attendances/bulk_record/", {
        section: attendanceSection,
        date: attendanceDate,
        records,
      });
      setAttendanceMsg(t("attendanceSaved"));
      await refreshContext();
    } catch {
      alert(t("attendanceSaveError"));
    } finally {
      setAttendanceSaving(false);
    }
  };

  const overviewCards = [
    { icon: "🏫", value: String(context?.sections.length ?? 0), label: t("mySections"), color: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" },
    { icon: "📢", value: String(context?.announcements.length ?? 0), label: t("announcements"), color: "linear-gradient(135deg, var(--color-success), var(--color-accent))" },
    { icon: "🚨", value: String(emergencyCount), label: t("emergencyAlerts"), color: "linear-gradient(135deg, var(--color-error), var(--color-warning))" },
    { icon: "🎫", value: String(openTickets), label: t("openTickets"), color: "linear-gradient(135deg, var(--color-accent), var(--color-primary))" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-6 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
              🏫
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>{t("myFollowUp")}</h1>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("myFollowUpDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              {ROLE_ICONS[user.role] || "🎓"} {t(roleKey) || user.role}
            </span>
            <Link href={`/${currentLocale}/dashboard`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-secondary)" }}>
              📊 {navT("dashboard")}
            </Link>
          </div>
        </div>

        {loading && !context ? (
          <div className="text-center py-16" style={{ color: "var(--color-text-muted)" }}>{commonT("loading")}</div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {overviewCards.map((card) => (
                <div key={card.label} className="p-4 rounded-3xl flex items-center gap-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: card.color }}>
                    <span className="text-xl">{card.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-bold leading-tight truncate" style={{ color: "var(--color-text)" }}>{card.value}</p>
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text-secondary)" }}>{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* My Sections */}
            {context && context.sections.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>🏫 {t("mySections")}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {context.sections.map((sec) => (
                    <div key={sec.id} className="p-5 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{sec.school_name}</h3>
                        <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>{sec.name}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p style={{ color: "var(--color-text-secondary)" }}>🎓 {sec.grade_name}</p>
                        <p style={{ color: "var(--color-text-muted)" }}>📅 {sec.academic_year_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {context && context.sections.length === 0 && (
              <div className="text-center py-10 rounded-3xl mb-8" style={{ background: "var(--color-surface)", border: "1px dashed var(--color-border)", color: "var(--color-text-muted)" }}>
                {t("noSections")}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b mb-6" style={{ borderColor: "var(--color-border)" }}>
              <button
                onClick={() => setActiveTab("announcements")}
                className={`px-5 py-2.5 rounded-t-2xl font-medium transition-all ${activeTab === "announcements" ? "text-white shadow-sm" : ""}`}
                style={{
                  background: activeTab === "announcements" ? "var(--color-primary)" : "transparent",
                  color: activeTab === "announcements" ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                📢 {t("announcements")}
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`px-5 py-2.5 rounded-t-2xl font-medium transition-all ${activeTab === "tickets" ? "text-white shadow-sm" : ""}`}
                style={{
                  background: activeTab === "tickets" ? "var(--color-primary)" : "transparent",
                  color: activeTab === "tickets" ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                🎫 {t("myTickets")}
              </button>
              <button
                onClick={() => setActiveTab("ai")}
                className={`px-5 py-2.5 rounded-t-2xl font-medium transition-all ${activeTab === "ai" ? "text-white shadow-sm" : ""}`}
                style={{
                  background: activeTab === "ai" ? "var(--color-primary)" : "transparent",
                  color: activeTab === "ai" ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                🤖 {t("aiAndVoice")}
              </button>
              <button
                onClick={() => setActiveTab("attachments")}
                className={`px-5 py-2.5 rounded-t-2xl font-medium transition-all ${activeTab === "attachments" ? "text-white shadow-sm" : ""}`}
                style={{
                  background: activeTab === "attachments" ? "var(--color-primary)" : "transparent",
                  color: activeTab === "attachments" ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                📎 {t("attachments")}
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-5 py-2.5 rounded-t-2xl font-medium transition-all ${activeTab === "attendance" ? "text-white shadow-sm" : ""}`}
                style={{
                  background: activeTab === "attendance" ? "var(--color-primary)" : "transparent",
                  color: activeTab === "attendance" ? "#FFFFFF" : "var(--color-text-secondary)",
                }}
              >
                ✅ {t("attendance")}
              </button>
            </div>

            {/* Announcements */}
            {activeTab === "announcements" && (
              <div className="space-y-4">
                {context && context.announcements.length === 0 && (
                  <div className="text-center py-10 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    {t("noAnnouncements")}
                  </div>
                )}
                {context?.announcements.map((ann) => (
                  <FadeIn key={ann.id} direction="up">
                    <div className={`p-6 rounded-3xl space-y-2 transition-all hover:-translate-y-0.5`} style={{
                      background: ann.is_emergency ? "rgba(239, 68, 68, 0.08)" : "var(--color-surface)",
                      border: `1px solid ${ann.is_emergency ? "rgba(239, 68, 68, 0.35)" : "var(--color-border)"}`,
                      boxShadow: ann.is_emergency ? "0 0 0 1px rgba(239,68,68,0.15)" : "var(--card-shadow)",
                    }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>{ann.title}</h3>
                          {ann.is_emergency && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold animate-pulse" style={{ background: "var(--color-error)", color: "#fff" }}>
                              🚨 {t("emergencyBadge")}
                            </span>
                          )}
                        </div>
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(ann.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-line" style={{ color: "var(--color-text-secondary)" }}>{ann.content}</p>
                      <div className="text-xs pt-2 border-t" style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}>
                        ✍️ {ann.author_email}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            )}

            {/* Tickets */}
            {activeTab === "tickets" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowTicketModal(true)}
                    className="px-5 py-2.5 rounded-2xl text-white font-semibold transition-all hover:opacity-90 shadow-sm"
                    style={{ background: "var(--color-primary)" }}
                  >
                    + {t("newTicket")}
                  </button>
                </div>

                {context && context.tickets.length === 0 && (
                  <div className="text-center py-10 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    {t("noTickets")}
                  </div>
                )}

                {context?.tickets.map((tk) => (
                  <div key={tk.id} className="p-6 rounded-3xl space-y-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{tk.title}</h3>
                      <span className="text-xs px-3 py-1 rounded-full font-bold" style={{
                        background: tk.status === "closed" ? "var(--color-surface-alt)" : "var(--color-success-light)",
                        color: tk.status === "closed" ? "var(--color-text-muted)" : "var(--color-success)",
                      }}>
                        {tk.status === "open" ? t("open") : tk.status === "in_progress" ? t("statusInProgress") : t("closed")}
                      </span>
                    </div>
                    <div className="text-sm flex flex-wrap gap-4" style={{ color: "var(--color-text-muted)" }}>
                      <span>👨‍🏫 {t("teacher")}: {tk.teacher_email}</span>
                      <span>🎓 {t("roleStudent")}: {tk.student_email}</span>
                    </div>

                    {/* Messages */}
                    <div className="space-y-2">
                      {(tk.messages || []).map((m, i) => (
                        <div key={i} className={`max-w-[80%] p-3 rounded-2xl text-sm`} style={{
                          background: m.role === "teacher" ? "var(--color-primary-light)" : "var(--color-surface-alt)",
                          color: "var(--color-text)",
                          marginInlineStart: m.role === "teacher" ? "auto" : undefined,
                        }}>
                          <div className="text-[10px] font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>
                            {m.sender} · {new Date(m.timestamp).toLocaleString(locale === "ar" ? "ar-JO" : "en-US")}
                          </div>
                          <p className="whitespace-pre-line">{m.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Reply box */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder={t("messagePlaceholder")}
                        value={replyText[tk.id] || ""}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [tk.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleReply(tk.id); }}
                        className="flex-1 px-4 py-2.5 rounded-2xl text-sm border focus:outline-none"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <button
                        onClick={() => handleReply(tk.id)}
                        disabled={sendingReply === tk.id || !replyText[tk.id]?.trim()}
                        className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {sendingReply === tk.id ? "..." : t("sendMessage")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI & Voice */}
            {activeTab === "ai" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* AI settings */}
                <div className="p-6 rounded-3xl space-y-5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                  <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>⚙️ {t("aiSettings")}</h3>
                  <form onSubmit={handleSaveAiSettings} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("languageComplexity")}</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-2xl border"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={aiForm.language_complexity}
                        onChange={(e) => setAiForm({ ...aiForm, language_complexity: e.target.value })}
                      >
                        <option value="simple">{t("complexitySimple")}</option>
                        <option value="medium">{t("complexityMedium")}</option>
                        <option value="advanced">{t("complexityAdvanced")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("tonePreference")}</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-2xl border"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={aiForm.tone_preference}
                        onChange={(e) => setAiForm({ ...aiForm, tone_preference: e.target.value })}
                      >
                        <option value="friendly">{t("toneFriendly")}</option>
                        <option value="formal">{t("toneFormal")}</option>
                        <option value="motivating">{t("toneMotivating")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("voiceType")}</label>
                      <select
                        className="w-full px-4 py-2.5 rounded-2xl border"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        value={aiForm.voice_type}
                        onChange={(e) => setAiForm({ ...aiForm, voice_type: e.target.value })}
                      >
                        <option value="default">{t("voiceDefault")}</option>
                        <option value="female">{t("voiceFemale")}</option>
                        <option value="male">{t("voiceMale")}</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl" style={{ background: "var(--color-surface-alt)" }}>
                      <input
                        type="checkbox"
                        className="w-5 h-5 accent-[var(--color-primary)]"
                        checked={aiForm.context_retrieval}
                        onChange={(e) => setAiForm({ ...aiForm, context_retrieval: e.target.checked })}
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{t("contextRetrieval")}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingAi}
                        className="px-5 py-2.5 rounded-2xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {savingAi ? "..." : t("saveSettings")}
                      </button>
                      {aiSaved && <span className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>{t("settingsSaved")}</span>}
                    </div>
                  </form>
                </div>

                {/* Voice */}
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>🎙️ {t("voiceTranscription")}</h3>
                    <button
                      onClick={toggleRecording}
                      disabled={transcribing}
                      className="px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: recording ? "var(--color-error)" : "var(--color-primary)" }}
                    >
                      {recording ? "⏹ " + t("stopRecording") : "🎙️ " + t("record")}
                    </button>
                    {transcribing && <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{commonT("loading")}...</p>}
                    {transcription && (
                      <div className="p-4 rounded-2xl text-sm whitespace-pre-line" style={{ background: "var(--color-surface-alt)", color: "var(--color-text)" }}>
                        <span className="font-bold" style={{ color: "var(--color-text-secondary)" }}>{t("transcriptionResult")}: </span>{transcription}
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-3xl space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>🔊 {t("voiceSynthesis")}</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t("messagePlaceholder")}
                        value={speechText}
                        onChange={(e) => setSpeechText(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-2xl text-sm border focus:outline-none"
                        style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                      />
                      <button
                        onClick={handleSynthesize}
                        disabled={!speechText.trim()}
                        className="px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "var(--color-primary)" }}
                      >
                        {t("synthesize")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            {activeTab === "attachments" && (
              <div className="space-y-6">
                {/* Upload form (teachers, students, admins) */}
                {(user.role === "teacher" || user.role === "student" || user.role === "admin") && (
                  <div className="p-6 rounded-3xl space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>📎 {t("uploadAttachment")}</h3>
                    <form onSubmit={handleUploadAttachment} className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("attachmentKind")}</label>
                        <select
                          className="w-full px-4 py-2.5 rounded-2xl border"
                          style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={attachmentForm.kind}
                          onChange={(e) => setAttachmentForm({ ...attachmentForm, kind: e.target.value })}
                        >
                          <option value="lesson">{t("kindLesson")}</option>
                          <option value="homework">{t("kindHomework")}</option>
                          <option value="submission">{t("kindSubmission")}</option>
                        </select>
                      </div>
                      {context && context.sections.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("section")}</label>
                          <select
                            className="w-full px-4 py-2.5 rounded-2xl border"
                            style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            value={attachmentForm.section}
                            onChange={(e) => setAttachmentForm({ ...attachmentForm, section: Number(e.target.value) })}
                          >
                            <option value={0}>--</option>
                            {context.sections.map((sec) => (
                              <option key={sec.id} value={sec.id}>{sec.school_name} - {sec.name} ({sec.grade_name})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("attachmentTitle")}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-2xl border"
                          style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={attachmentForm.title}
                          onChange={(e) => setAttachmentForm({ ...attachmentForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("attachmentDescription")}</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-2xl border"
                          style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={attachmentForm.description}
                          onChange={(e) => setAttachmentForm({ ...attachmentForm, description: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("file")}</label>
                        <input
                          type="file"
                          onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                          className="w-full text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={uploading}
                          className="px-5 py-2.5 rounded-2xl text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "var(--color-primary)" }}
                        >
                          {uploading ? t("uploading") : "⬆️ " + t("uploadAttachment")}
                        </button>
                        {uploadMsg && <span className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>{uploadMsg}</span>}
                      </div>
                    </form>
                  </div>
                )}

                {/* Admin monitoring header */}
                {user.role === "admin" && (
                  <div className="p-4 rounded-3xl flex items-center justify-between gap-3" style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)" }}>
                    <div className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>🛡️ {t("adminMonitor")}</div>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: "var(--color-warning-light)", color: "var(--color-warning)" }}>
                      {context?.attachments.filter((a) => a.review_status === "pending").length ?? 0} {t("attachmentsPending")}
                    </span>
                  </div>
                )}

                {/* List */}
                {context && context.attachments.length === 0 && (
                  <div className="text-center py-10 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                    {t("noAttachments")}
                  </div>
                )}

                {context?.attachments.map((att) => {
                  const isImage = att.mime_type?.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(att.file_name || "");
                  const statusKey = att.review_status === "approved" ? "reviewApproved" : att.review_status === "rejected" ? "reviewRejected" : "reviewPending";
                  return (
                    <FadeIn key={att.id} direction="up">
                      <div className="p-6 rounded-3xl space-y-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{isImage ? "🖼️" : "📄"}</span>
                            <div>
                              <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{att.title || att.file_name}</h3>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                {att.kind_display} · {att.uploader_name} · {att.section_name || "-"} · {new Date(att.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-3 py-1 rounded-full font-bold" style={{
                              background: att.review_status === "approved" ? "var(--color-success-light)" : att.review_status === "rejected" ? "rgba(239,68,68,0.12)" : "var(--color-warning-light)",
                              color: att.review_status === "approved" ? "var(--color-success)" : att.review_status === "rejected" ? "var(--color-error)" : "var(--color-warning)",
                            }}>
                              {t(statusKey)}
                            </span>
                            <a
                              href={att.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-85"
                              style={{ background: "var(--color-primary)" }}
                            >
                              ⬇️ {t("download")}
                            </a>
                          </div>
                        </div>
                        {att.description && <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{att.description}</p>}
                        {att.review_notes && (
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>📝 {t("reviewNotes")}: {att.review_notes}</p>
                        )}
                        {isImage && att.file_url && (
                          <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={att.file_url} alt={att.title || att.file_name} className="rounded-2xl max-h-64 object-cover" style={{ border: "1px solid var(--color-border)" }} />
                          </a>
                        )}

                        {/* Admin review controls */}
                        {user.role === "admin" && (
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--color-border)" }}>
                            <input
                              type="text"
                              placeholder={t("reviewNotes")}
                              value={reviewNotes[att.id] || ""}
                              onChange={(e) => setReviewNotes((prev) => ({ ...prev, [att.id]: e.target.value }))}
                              className="flex-1 min-w-[200px] px-3 py-2 rounded-xl text-sm border focus:outline-none"
                              style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            />
                            <button
                              onClick={() => handleReviewAttachment(att.id, "approved")}
                              disabled={reviewing === att.id}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
                              style={{ background: "var(--color-success)" }}
                            >
                              ✓ {t("approve")}
                            </button>
                            <button
                              onClick={() => handleReviewAttachment(att.id, "rejected")}
                              disabled={reviewing === att.id}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-85 disabled:opacity-50"
                              style={{ background: "var(--color-error)" }}
                            >
                              ✗ {t("reject")}
                            </button>
                          </div>
                        )}
                      </div>
                    </FadeIn>
                  );
                })}
              </div>
            )}

            {/* Attendance */}
            {activeTab === "attendance" && (
              <div className="space-y-6">
                {(user.role === "teacher" || user.role === "school_admin" || user.role === "admin") && (
                  <div className="p-6 rounded-3xl space-y-4" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                    <h3 className="font-bold text-lg" style={{ color: "var(--color-text)" }}>✅ {t("recordAttendance")}</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {context && context.sections.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("section")}</label>
                          <select
                            className="w-full px-4 py-2.5 rounded-2xl border"
                            style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                            value={attendanceSection}
                            onChange={(e) => setAttendanceSection(Number(e.target.value))}
                          >
                            <option value={0}>--</option>
                            {context.sections.map((sec) => (
                              <option key={sec.id} value={sec.id}>{sec.school_name} - {sec.name} ({sec.grade_name})</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("date")}</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 rounded-2xl border"
                          style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                          value={attendanceDate}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      onClick={loadAttendance}
                      disabled={!attendanceSection || attendanceLoading}
                      className="px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: "var(--color-primary)" }}
                    >
                      {attendanceLoading ? commonT("loading") + "..." : t("loadStudents")}
                    </button>

                    {attendanceRows.length > 0 && (
                      <>
                        <div className="pt-2 border-t space-y-2" style={{ borderColor: "var(--color-border)" }}>
                          {attendanceRows.map((row) => (
                            <div key={row.student} className="flex items-center justify-between gap-3 p-3 rounded-2xl" style={{ background: "var(--color-surface-alt)" }}>
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xl shrink-0">{row.status === "present" ? "✅" : "❌"}</span>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{row.name}</p>
                                  <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{row.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => setAttendanceRows((rows) => rows.map((r) => r.student === row.student ? { ...r, status: "present" } : r))}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-85"
                                  style={{
                                    background: row.status === "present" ? "var(--color-success)" : "var(--color-surface)",
                                    color: row.status === "present" ? "#FFFFFF" : "var(--color-text-secondary)",
                                    border: row.status === "present" ? "none" : "1px solid var(--color-border)",
                                  }}
                                >
                                  {t("present")}
                                </button>
                                <button
                                  onClick={() => setAttendanceRows((rows) => rows.map((r) => r.student === row.student ? { ...r, status: "absent" } : r))}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-85"
                                  style={{
                                    background: row.status === "absent" ? "var(--color-error)" : "var(--color-surface)",
                                    color: row.status === "absent" ? "#FFFFFF" : "var(--color-text-secondary)",
                                    border: row.status === "absent" ? "none" : "1px solid var(--color-border)",
                                  }}
                                >
                                  {t("absent")}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={submitAttendance}
                            disabled={attendanceSaving}
                            className="px-5 py-2.5 rounded-2xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                            style={{ background: "var(--color-success)" }}
                          >
                            {attendanceSaving ? "..." : t("saveAttendance")}
                          </button>
                          {attendanceMsg && <span className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>{attendanceMsg}</span>}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {user.role === "student" || user.role === "parent" ? (
                  <div>
                    {context && context.attendance.length === 0 && (
                      <div className="text-center py-10 rounded-3xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                        {t("noAttendance")}
                      </div>
                    )}
                    {context?.attendance.map((att) => (
                      <FadeIn key={att.id} direction="up">
                        <div className="p-6 rounded-3xl flex items-center justify-between gap-3 mb-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{att.status === "present" ? "✅" : "❌"}</span>
                            <div className="min-w-0">
                              <p className="font-bold" style={{ color: "var(--color-text)" }}>{att.student_name}</p>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                {att.section_name || "-"} · {att.date} · {att.recorded_by_email || "-"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs px-3 py-1.5 rounded-full font-bold shrink-0" style={{
                            background: att.status === "present" ? "var(--color-success-light)" : "rgba(239,68,68,0.12)",
                            color: att.status === "present" ? "var(--color-success)" : "var(--color-error)",
                          }}>
                            {att.status_display}
                          </span>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                ) : (
                  context && context.attendance.length > 0 && (
                    <div>
                      <h3 className="font-bold text-lg mb-3" style={{ color: "var(--color-text)" }}>📋 {t("recentAttendance")}</h3>
                      {context.attendance.map((att) => (
                        <FadeIn key={att.id} direction="up">
                          <div className="p-6 rounded-3xl flex items-center justify-between gap-3 mb-3" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-2xl">{att.status === "present" ? "✅" : "❌"}</span>
                              <div className="min-w-0">
                                <p className="font-bold" style={{ color: "var(--color-text)" }}>{att.student_name}</p>
                                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                                  {att.section_name || "-"} · {att.date}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs px-3 py-1.5 rounded-full font-bold shrink-0" style={{
                              background: att.status === "present" ? "var(--color-success-light)" : "rgba(239,68,68,0.12)",
                              color: att.status === "present" ? "var(--color-success)" : "var(--color-error)",
                            }}>
                              {att.status_display}
                            </span>
                          </div>
                        </FadeIn>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl" style={{ background: "var(--color-surface)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>🎫 {t("newTicket")}</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("teacher")}</label>
                <select
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={ticketForm.teacher}
                  onChange={(e) => setTicketForm({ ...ticketForm, teacher: Number(e.target.value) })}
                >
                  <option value="">-- {t("selectTeacher")} --</option>
                  {(context?.teachers || []).map((tch) => (
                    <option key={tch.id} value={tch.id}>{tch.name} ({tch.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("roleStudent")}</label>
                <select
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={ticketForm.student}
                  onChange={(e) => setTicketForm({ ...ticketForm, student: Number(e.target.value) })}
                >
                  <option value="">-- {t("selectStudent")} --</option>
                  {(context?.students || []).map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("subject")}</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border rounded-2xl"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{t("ticketTitle")}</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border rounded-2xl"
                  style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-5 py-2.5 rounded-2xl font-medium"
                  style={{ background: "var(--color-surface-alt)", color: "var(--color-text-secondary)" }}
                >
                  {commonT("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 rounded-2xl font-medium text-white disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  {sending ? "..." : commonT("submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SchoolMarketingPage() {
  const t = useTranslations("schools");
  const locale = useLocale();

  const features = [
    { icon: "📢", title: t("marketingFeature1Title"), desc: t("marketingFeature1Desc"), color: "var(--color-primary-light)" },
    { icon: "🎫", title: t("marketingFeature2Title"), desc: t("marketingFeature2Desc"), color: "var(--color-success-light)" },
    { icon: "✅", title: t("marketingFeature3Title"), desc: t("marketingFeature3Desc"), color: "var(--color-warning-light)" },
    { icon: "📎", title: t("marketingFeature4Title"), desc: t("marketingFeature4Desc"), color: "var(--color-accent-light)" },
    { icon: "🎙️", title: t("marketingFeature5Title"), desc: t("marketingFeature5Desc"), color: "var(--color-error)" },
    { icon: "📊", title: t("marketingFeature6Title"), desc: t("marketingFeature6Desc"), color: "var(--color-secondary)" },
  ];

  const stats = [
    { icon: "🏫", label: t("marketingStatsSections") },
    { icon: "🎓", label: t("marketingStatsStudents") },
    { icon: "💬", label: t("marketingStatsAlerts") },
  ];

  const steps = [
    { icon: "1️⃣", title: t("marketingStep1Title"), desc: t("marketingStep1Desc") },
    { icon: "2️⃣", title: t("marketingStep2Title"), desc: t("marketingStep2Desc") },
    { icon: "3️⃣", title: t("marketingStep3Title"), desc: t("marketingStep3Desc") },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }} dir={locale === "ar" || locale === "ur" || locale === "fa" ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold text-white mb-6" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}>
            🏫 {t("marketingHeroBadge")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: "var(--font-heading)" }}>
            {t("marketingHeroTitle")}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("marketingHeroSubtitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/register`} className="px-6 py-3 rounded-2xl font-bold transition-all hover:opacity-90" style={{ background: "var(--color-surface)", color: "var(--color-primary)" }}>
              {t("marketingCtaRegister")}
            </Link>
            <Link href={`/${locale}/login`} className="px-6 py-3 rounded-2xl font-bold text-white transition-all hover:opacity-90" style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}>
              {t("marketingCtaLogin")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-14">
            {stats.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl text-white" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-sm font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20" style={{ background: "var(--color-background)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{t("marketingFeaturesTitle")}</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>{t("marketingFeaturesSubtitle")}</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-3xl transition-all hover:-translate-y-1" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-white" style={{ background: f.color }}>
                  <span className="text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--color-text)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20" style={{ background: "var(--color-surface)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)" }}>{t("marketingHowTitle")}</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--color-text-muted)" }}>{t("marketingHowSubtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="p-6 rounded-3xl text-center" style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", boxShadow: "var(--card-shadow)" }}>
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: "var(--color-text)" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-3xl p-10 sm:p-14 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>{t("marketingCtaTitle")}</h2>
            <p className="text-lg max-w-2xl mx-auto mb-8 text-white/90">{t("marketingCtaSubtitle")}</p>
            <Link href={`/${locale}/register`} className="inline-block px-8 py-3 rounded-2xl font-bold transition-all hover:opacity-90" style={{ background: "var(--color-surface)", color: "var(--color-primary)" }}>
              {t("marketingCtaButton")}
            </Link>
            <p className="text-sm mt-6 text-white/80">
              {t("marketingCurriculumNote")}{" "}
              <Link href={`/${locale}/curriculum`} className="font-bold underline underline-offset-2 hover:opacity-90">{t("marketingCurriculumCta")}</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

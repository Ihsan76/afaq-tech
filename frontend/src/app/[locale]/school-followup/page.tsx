"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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

interface MyContext {
  role: string;
  sections: Section[];
  announcements: Announcement[];
  tickets: Ticket[];
  teachers: Person[];
  students: Person[];
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
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split("/")[1] || "en";
  const { user, isLoading, loadUser } = useAuthStore();
  const loadedRef = useRef(false);

  const [context, setContext] = useState<MyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"announcements" | "tickets" | "ai">("announcements");

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

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [loadUser]);

  useEffect(() => {
    if (loadedRef.current && !isLoading && !user) {
      router.push(`/${currentLocale}/login`);
    }
  }, [user, isLoading, router, currentLocale]);

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

  if (!user) return null;

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

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  service_interest: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new: { bg: "var(--color-primary-light)", color: "var(--color-primary)" },
  read: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
  replied: { bg: "var(--color-success-light)", color: "var(--color-success)" },
  archived: { bg: "var(--color-surface-alt)", color: "var(--color-text-muted)" },
};

export default function AdminMessagesPage() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/pages/admin/contact/");
      setMessages(res.data.results || res.data);
    } catch {} finally { setIsLoading(false); }
  };

  const updateStatus = async (msg: ContactMessage, newStatus: string) => {
    try {
      await api.patch(`/pages/admin/contact/${msg.id}/`, { status: newStatus });
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status: newStatus as any } : m)));
      if (selected?.id === msg.id) setSelected({ ...selected, status: newStatus as any });
    } catch {}
  };

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === "new") updateStatus(msg, "read");
  };

  const filtered = filter ? messages.filter((m) => m.status === filter) : messages;
  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)", fontFamily: "var(--font-heading)" }}>
          {t("admin.messages")} ({filtered.length})
          {newCount > 0 && (
            <span className="mr-2 text-xs px-2 py-1 rounded-full font-bold align-middle" style={{ background: "var(--color-primary)", color: "white" }}>
              {newCount} {t("admin.statusNew")}
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          {["", "new", "read", "replied", "archived"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === f ? "var(--color-primary)" : "var(--color-surface)",
                color: filter === f ? "white" : "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              {f === "" ? t("blog.all") : t(`admin.status${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12" style={{ color: "var(--color-text-muted)" }}>{t("admin.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <p style={{ color: "var(--color-text-muted)" }}>{t("admin.noMessages")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const st = STATUS_STYLES[msg.status] || STATUS_STYLES.new;
            return (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className="w-full text-start p-4 rounded-2xl transition-all hover:opacity-90 flex items-center gap-4"
                style={{
                  background: "var(--color-surface)",
                  border: `1px solid ${msg.status === "new" ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  {msg.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate" style={{ color: "var(--color-text)", fontWeight: msg.status === "new" ? 800 : 600 }}>
                      {msg.name}
                    </span>
                    <span className="text-xs truncate hidden sm:inline" style={{ color: "var(--color-text-muted)" }}>{msg.email}</span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {msg.subject || msg.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.color }}>
                    {t(`admin.status${msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}`)}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleDateString(locale === "ar" ? "ar-JO" : "en-US", { month: "short", day: "numeric" }) : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Message Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-3xl overflow-hidden" style={{ background: "var(--color-surface)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold" style={{ color: "var(--color-text)" }}>{t("admin.viewMessage")}</h3>
              <button onClick={() => setSelected(null)} className="text-xl" style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}>
                  {selected.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-bold" style={{ color: "var(--color-text)" }}>{selected.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{selected.email}{selected.phone ? ` • ${selected.phone}` : ""}</p>
                </div>
              </div>
              {selected.subject && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{t("contact.subject")}</p>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>{selected.subject}</p>
                </div>
              )}
              {selected.service_interest && (
                <div>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{t("admin.serviceInterest")}</p>
                  <p className="text-sm" style={{ color: "var(--color-text)" }}>{selected.service_interest}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold mb-1" style={{ color: "var(--color-text-muted)" }}>{t("contact.message")}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text)" }}>{selected.message}</p>
              </div>
              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {t("admin.receivedAt")}: {selected.created_at ? new Date(selected.created_at).toLocaleString(locale === "ar" ? "ar-JO" : "en-US") : ""}
              </p>
            </div>
            <div className="p-4 border-t flex gap-2 flex-wrap" style={{ borderColor: "var(--color-border)" }}>
              <a href={`mailto:${selected.email}`} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "var(--color-primary)" }}>
                📧 {selected.email}
              </a>
              {selected.status !== "replied" && (
                <button onClick={() => updateStatus(selected, "replied")} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "var(--color-success-light)", color: "var(--color-success)" }}>
                  ✓ {t("admin.markReplied")}
                </button>
              )}
              {selected.status !== "archived" && (
                <button onClick={() => updateStatus(selected, "archived")} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
                  {t("admin.archive")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

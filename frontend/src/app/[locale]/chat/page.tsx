"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useLiveChatStore } from "@/store/liveChat";
import { useAuthStore } from "@/store/auth";

export default function ChatPage() {
  const t = useTranslations("chat");
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    typing,
    loading,
    fetchConversations,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
  } = useLiveChatStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      connectWebSocket(activeConversation);
      return () => disconnectWebSocket();
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    sendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversation);

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ background: "var(--color-background)" }}>
      {/* Conversations sidebar */}
      <div className="w-80 border-r flex flex-col" style={{ borderColor: "var(--color-border)" }}>
        <div className="p-4 border-b font-bold" style={{ borderColor: "var(--color-border)" }}>
          {t("conversations")}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const other = conv.participants_detail.find((p) => p.id !== user?.id);
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversation(conv.id)}
                className={`w-full text-start p-4 border-b transition-colors ${
                  activeConversation === conv.id ? "bg-[var(--color-primary)]/10" : "hover:bg-[var(--color-surface-alt)]"
                }`}
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm truncate">{other?.name || other?.email || t("unknown")}</div>
                  {conv.unread_count > 0 && (
                    <span className="bg-[var(--color-primary)] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="text-xs mt-1 truncate opacity-60">{conv.last_message.content}</p>
                )}
              </button>
            );
          })}
          {conversations.length === 0 && (
            <p className="text-sm text-center py-8 opacity-50">{t("noConversations")}</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: "var(--color-border)" }}>
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center font-bold text-[var(--color-primary)]">
                {activeConv?.participants_detail.find((p) => p.id !== user?.id)?.name?.charAt(0) || "?"}
              </div>
              <div>
                <div className="font-bold text-sm">
                  {activeConv?.participants_detail.find((p) => p.id !== user?.id)?.name || t("unknown")}
                </div>
                {Object.keys(typing).length > 0 && (
                  <div className="text-xs text-[var(--color-primary)] animate-pulse">{t("typing")}</div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-8 opacity-50">{t("loading")}</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                          isMe
                            ? "text-white rounded-br-sm"
                            : "rounded-bl-sm"
                        }`}
                        style={
                          isMe
                            ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }
                            : { background: "var(--color-surface)", border: "1px solid var(--color-border)" }
                        }
                      >
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? "text-white/60" : "opacity-40"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeMessage")}
                  className="flex-1 px-4 py-3 rounded-2xl border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  {t("send")}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm opacity-40">{t("selectConversation")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

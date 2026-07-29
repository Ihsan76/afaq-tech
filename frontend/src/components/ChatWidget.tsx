"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { usePathname } from "next/navigation";
import MarkdownRenderer from "./MarkdownRenderer";

export default function ChatWidget() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const {
    isOpen, toggleOpen, conversations, activeId, messages, streamingContent,
    isStreaming, error, loadConversations, sendMessage, deleteConversation,
    clearConversation, setActive, createConversation, models, selectedModel,
    loadModels, setSelectedModel,
  } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"list" | "chat">("list");
  const [showModels, setShowModels] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) { loadConversations(); loadModels(); }
  }, [user, loadConversations, loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingContent, activeId, messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeId && conversations.find((c) => c.id === activeId)) {
      setView("chat");
    }
  }, [activeId, conversations]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setShowModels(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeMessages = activeId ? messages[activeId] || [] : [];

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text, selectedModel || undefined);
  }, [input, isStreaming, sendMessage, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleNewChat = async () => {
    await createConversation();
    setView("chat");
  };

  const handleBack = () => {
    setActive(null);
    setView("list");
  };

  const currentModel = models.find((m) => m.model_id === selectedModel);

  if (!user) return null;

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed z-50 bottom-6 left-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
        aria-label="Chat assistant"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      <div
        className="fixed z-50 bottom-24 left-6 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 flex flex-col"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 25px 80px -12px rgba(0,0,0,0.35)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
            color: "white",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {view === "chat" && activeId && (
              <button onClick={handleBack} className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-semibold text-sm truncate">
              {view === "chat" && activeId
                ? (conversations.find((c) => c.id === activeId)?.title || "محادثة")
                : "المساعد الذكي"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {view === "chat" && models.length > 0 && (
              <div ref={modelRef} className="relative">
                <button
                  onClick={() => setShowModels(!showModels)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors text-xs"
                  title={currentModel?.name?.[locale] || currentModel?.name_ar || "اختر النموذج"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </button>
                {showModels && (
                  <div
                    className="absolute bottom-full right-0 mb-2 w-52 rounded-xl shadow-2xl overflow-y-auto z-50 py-1"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      maxHeight: "40vh",
                    }}
                  >
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m.model_id); setShowModels(false); }}
                        className="w-full text-right px-3 py-2 text-sm transition-colors"
                        style={{
                          backgroundColor: m.model_id === selectedModel ? "var(--color-primary-light)" : "transparent",
                          color: m.model_id === selectedModel ? "var(--color-primary)" : "var(--color-text)",
                        }}
                        onMouseEnter={(e) => { if (m.model_id !== selectedModel) e.currentTarget.style.backgroundColor = "var(--color-muted)"; }}
                        onMouseLeave={(e) => { if (m.model_id !== selectedModel) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <div className="font-medium">{m.name?.[locale] || m.name_ar}</div>
                        <div className="text-xs opacity-70">{m.name_en}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={toggleOpen} className="p-1 rounded-lg hover:bg-white/20 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {view === "list" ? (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => { setActive(id); setView("chat"); }}
              onDelete={deleteConversation}
              onNewChat={handleNewChat}
            />
          ) : (
            <ChatView
              messages={activeMessages}
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              error={error}
            />
          )}
        </div>

        {/* Input */}
        {view === "chat" && (
          <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ backgroundColor: "var(--color-muted)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك..."
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
                style={{ color: "var(--color-text)", maxHeight: "120px" }}
                disabled={isStreaming}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ConversationList({ conversations, activeId, onSelect, onDelete, onNewChat }: {
  conversations: { id: number; title: string; last_message: { content: string } | null }[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="p-3 space-y-2">
      <button onClick={onNewChat}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        محادثة جديدة
      </button>
      {conversations.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>لا توجد محادثات سابقة</p>
      )}
      {conversations.map((conv) => (
        <div key={conv.id}
          className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
          style={{ backgroundColor: activeId === conv.id ? "var(--color-primary-light)" : "transparent" }}
          onClick={() => onSelect(conv.id)}
          onMouseEnter={(e) => { if (activeId !== conv.id) e.currentTarget.style.backgroundColor = "var(--color-muted)"; }}
          onMouseLeave={(e) => { if (activeId !== conv.id) e.currentTarget.style.backgroundColor = "transparent"; }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: activeId === conv.id ? "var(--color-primary)" : "var(--color-text)" }}>
              {conv.title || "محادثة"}
            </p>
            {conv.last_message && (
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{conv.last_message.content}</p>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-100"
            style={{ color: "var(--color-error)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function ChatView({ messages, streamingContent, isStreaming, error }: {
  messages: { id: number; role: string; content: string }[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h3 className="font-bold text-lg mb-1" style={{ color: "var(--color-text)" }}>المساعد الذكي</h3>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>اسألني عن أي شيء — التعليم، التقنية، أو مساعدتك في مهامك</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "text-white" : ""}`}
            style={msg.role === "user"
              ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))", borderBottomLeftRadius: "4px" }
              : { backgroundColor: "var(--color-muted)", color: "var(--color-text)", borderBottomRightRadius: "4px" }
            }
          >
            {msg.role === "assistant" ? <MarkdownRenderer content={msg.content} /> : <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>}
          </div>
        </div>
      ))}
      {isStreaming && streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
            style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text)", borderBottomRightRadius: "4px" }}
          >
            <MarkdownRenderer content={streamingContent} />
            <span className="inline-block w-2 h-4 mr-0.5 animate-pulse" style={{ backgroundColor: "var(--color-primary)" }} />
          </div>
        </div>
      )}
      {isStreaming && !streamingContent && (
        <div className="flex justify-start">
          <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--color-muted)" }}>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-primary)", animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-primary)", animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--color-primary)", animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>{error}</div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

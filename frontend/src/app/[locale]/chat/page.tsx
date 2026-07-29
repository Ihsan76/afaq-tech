"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "@/store/chat";
import { useAuthStore } from "@/store/auth";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface PageData {
  id: number;
  slug: string;
  translations: Record<string, Record<string, string>>;
  template: string;
  is_published: boolean;
  layout_config: Record<string, string>;
  show_in_nav: boolean;
  nav_order: number;
  nav_icon: string;
}

export default function ChatPage() {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const { user } = useAuthStore();
  const {
    conversations, activeId, messages, streamingContent, isStreaming,
    error, loadConversations, loadMessages, sendMessage, deleteConversation,
    clearConversation, setActive, createConversation, models, selectedModel,
    loadModels, setSelectedModel,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showModels, setShowModels] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageDisabled, setPageDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setPageLoading(false); return; }
    api.get("/pages/ai-chat/")
      .then((res) => { setPageData(res.data); setPageLoading(false); })
      .catch(() => { setPageDisabled(true); setPageLoading(false); });
  }, [user]);

  useEffect(() => {
    if (user) { loadConversations(); loadModels(); }
  }, [user, loadConversations, loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [streamingContent, activeId, messages]);

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

  const handleNewChat = async () => { await createConversation(); };

  const handleSelectConv = (id: number) => {
    setActive(id);
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const currentModel = models.find((m) => m.model_id === selectedModel);

  const pageTitle = pageData?.translations?.[locale]?.title || t("chat.title") || "المساعد الذكي";
  const pageDescription = pageData?.translations?.[locale]?.description || "";

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            {pageTitle}
          </h1>
          <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
            {t("chat.loginRequired") || "سجل الدخول لاستخدام المساعد الذكي"}
          </p>
          <Link href={`/${locale}/login`}
            className="inline-flex px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            {t("auth.login")}
          </Link>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (pageDisabled) {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--color-background)" }}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
            الصفحة غير متاحة
          </h1>
          <p className="mb-6" style={{ color: "var(--color-text-muted)" }}>
            صفحة المساعد الذكي غير منشورة حالياً. يرجى التواصل مع المشرف.
          </p>
          <Link href={`/${locale}`}
            className="inline-flex px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const layoutStyle: Record<string, string> = {};
  if (pageData?.layout_config?.max_width) layoutStyle.maxWidth = pageData.layout_config.max_width;
  if (pageData?.layout_config?.padding !== undefined) layoutStyle.padding = pageData.layout_config.padding;
  if (pageData?.layout_config?.background) layoutStyle.background = pageData.layout_config.background;

  return (
    <div className="h-screen flex" style={{ backgroundColor: "var(--color-background)", ...layoutStyle }}>
      {/* Sidebar */}
      <div className={`${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative z-30 w-72 h-full transition-transform duration-200 flex flex-col`}
        style={{ backgroundColor: "var(--color-surface)", borderLeft: "1px solid var(--color-border)" }}
      >
        <div className="p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <button onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("chat.newChat") || "محادثة جديدة"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: "var(--color-text-muted)" }}>
              {t("chat.noConversations") || "لا توجد محادثات"}
            </p>
          )}
          {conversations.map((conv) => (
            <div key={conv.id}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
              style={{ backgroundColor: activeId === conv.id ? "var(--color-primary-light)" : "transparent" }}
              onClick={() => handleSelectConv(conv.id)}
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
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
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
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setShowSidebar(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <button className="md:hidden p-2 rounded-lg" style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>
              {activeId
                ? (conversations.find((c) => c.id === activeId)?.title || "محادثة")
                : pageTitle}
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {currentModel ? currentModel.name_ar : (isStreaming ? "يكتب..." : "متصل")}
            </p>
          </div>

          {/* Model selector */}
          <div ref={modelRef} className="relative">
            <button onClick={() => setShowModels(!showModels)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: showModels ? "var(--color-primary-light)" : "var(--color-muted)",
                color: "var(--color-text-secondary)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="hidden sm:inline">{currentModel?.name_ar || "اختر النموذج"}</span>
            </button>
            {showModels && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
              >
                {models.map((m) => (
                  <button key={m.id} onClick={() => { setSelectedModel(m.model_id); setShowModels(false); }}
                    className="w-full text-right px-4 py-2.5 text-sm transition-colors"
                    style={{
                      backgroundColor: m.model_id === selectedModel ? "var(--color-primary-light)" : "transparent",
                      color: m.model_id === selectedModel ? "var(--color-primary)" : "var(--color-text)",
                    }}
                    onMouseEnter={(e) => { if (m.model_id !== selectedModel) e.currentTarget.style.backgroundColor = "var(--color-muted)"; }}
                    onMouseLeave={(e) => { if (m.model_id !== selectedModel) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div className="font-medium">{m.name_ar}</div>
                    <div className="text-xs opacity-70" style={{ color: "var(--color-text-muted)" }}>{m.name_en}</div>
                    {m.description_ar && (
                      <div className="text-xs mt-0.5 opacity-60" style={{ color: "var(--color-text-muted)" }}>{m.description_ar}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeId && (
            <button onClick={() => clearConversation(activeId)}
              className="p-2 rounded-lg text-xs transition-all" style={{ color: "var(--color-text-muted)" }}
              title={t("chat.clear") || "مسح المحادثة"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Messages — scrollable area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {!activeId && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
                  {t("chat.greeting") || "كيف يمكنني مساعدتك؟"}
                </h1>
                <p className="text-sm mb-8 max-w-md" style={{ color: "var(--color-text-muted)" }}>
                  {pageDescription || t("chat.subtitle") || "اسألني عن أي شيء — التعليم، التقنية، أو مساعدتك في مهامك اليومية"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    t("chat.suggestion1") || "اشرح لي مفهوم البرمجة",
                    t("chat.suggestion2") || "كيف أبدأ بتعلم الذكاء الاصطناعي؟",
                    t("chat.suggestion3") || "ما هي أفضل ممارسات التعليم عن بعد؟",
                    t("chat.suggestion4") || "ساعدني في تحضير درس",
                  ].map((suggestion, i) => (
                    <button key={i} onClick={() => { setInput(suggestion); setTimeout(() => inputRef.current?.focus(), 100); }}
                      className="px-4 py-3 rounded-xl text-sm text-start transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "text-white" : ""}`}
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
                <div className="max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
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

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input — always at bottom */}
        <div className="shrink-0 p-4 border-t" style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--color-muted)" }}>
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.placeholder") || "اكتب رسالتك..."}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed"
                style={{ color: "var(--color-text)", maxHeight: "150px" }}
                disabled={isStreaming}
              />
              <button onClick={handleSend} disabled={!input.trim() || isStreaming}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

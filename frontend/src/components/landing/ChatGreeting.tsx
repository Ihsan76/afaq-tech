"use client";

import { useTranslations, useLocale } from "next-intl";
import { localizedContent } from "@/lib/i18n";

interface ChatGreetingProps {
  content?: Record<string, any>;
}

export default function ChatGreeting({ content }: ChatGreetingProps) {
  const t = useTranslations();
  const c = content || {};
  const locale = useLocale();

  const items = c.items?.map((item: any) => ({
    text: localizedContent(item, "text", locale),
  })) || [];

  const title = localizedContent(c, "heading", locale, t("chat.greeting") || "كيف يمكنني مساعدتك؟");
  const subtitle = localizedContent(c, "subtitle", locale, t("chat.subtitle") || "اسألني عن أي شيء — التعليم، التقنية، أو مساعدتك في مهامك اليومية");
  const suggestions = items.length ? items.map((i: any) => i.text) : [
    t("chat.suggestion1") || "اشرح لي مفهوم البرمجة",
    t("chat.suggestion2") || "كيف أبدأ بتعلم الذكاء الاصطناعي؟",
    t("chat.suggestion3") || "ما هي أفضل ممارسات التعليم عن بعد؟",
    t("chat.suggestion4") || "ساعدني في تحضير درس",
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
      >
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-text)" }}>
        {title}
      </h1>
      <p className="text-sm mb-[30px] max-w-md" style={{ color: "var(--color-text-muted)" }}>
        {subtitle}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((suggestion: string, i: number) => (
          <div key={i}
            className="px-4 py-3 rounded-xl text-sm text-start transition-all"
            style={{ backgroundColor: "var(--color-muted)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
}

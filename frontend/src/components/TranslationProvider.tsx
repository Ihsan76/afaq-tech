"use client";

import { useMemo } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useApiList } from "@/lib/useApi";

interface TranslationItem {
  id: number;
  key: string;
  namespace: string;
  translations: Record<string, string>;
  is_active: boolean;
}

function setNested(obj: Record<string, any>, path: string, value: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof cur[part] !== "object" || cur[part] === null) cur[part] = {};
    cur = cur[part];
  }
  cur[parts[parts.length - 1]] = value;
}

function deepMerge(base: Record<string, any>, overrides: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const existing = out[key];
    if (value && typeof value === "object" && !Array.isArray(value) && existing && typeof existing === "object" && !Array.isArray(existing)) {
      out[key] = deepMerge(existing, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export default function TranslationProvider({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: Record<string, any>;
  locale: string;
}) {
  const { data } = useApiList<TranslationItem>("/core/translations/");

  const merged = useMemo(() => {
    const overrides: Record<string, any> = {};
    for (const item of data || []) {
      const value = item.translations?.[locale];
      if (typeof value === "string" && value !== "") {
        setNested(overrides, item.key, value);
      }
    }
    return deepMerge(messages, overrides);
  }, [data, locale, messages]);

  return (
    <NextIntlClientProvider locale={locale} messages={merged}>
      {children}
    </NextIntlClientProvider>
  );
}

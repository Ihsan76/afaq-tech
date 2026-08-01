"use client";

import { useApiList } from "@/lib/useApi";
import { locales, localeNames, localeFlags, localeRtl, defaultLocale } from "@/i18n/config";

export interface Language {
  id: number;
  code: string;
  name: string;
  native_name: string;
  flag: string;
  is_rtl: boolean;
  is_active: boolean;
  is_default: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  flag?: string;
}

/**
 * Fallback list built from the i18n config (single source of truth, kept in
 * sync with the backend via `npm run sync:locales`). Used only when the API
 * is unavailable.
 */
function configLanguages(): Language[] {
  return locales.map((code, index) => ({
    id: index + 1,
    code,
    name: localeNames[code] || code,
    native_name: localeNames[code] || code,
    flag: localeFlags[code] || "🌐",
    is_rtl: !!localeRtl[code],
    is_active: true,
    is_default: code === defaultLocale,
    order: index + 1,
  }));
}

const STATIC_LANGUAGES = configLanguages();

/**
 * Loads active languages (public endpoint). Falls back to the static
 * config locales if the API is unavailable.
 */
export function useLanguages() {
  const { data, error, loading } = useApiList<Language>("/core/languages/");
  const languages: Language[] = data && data.length > 0 ? data : STATIC_LANGUAGES;
  const options: LanguageOption[] = languages.map((l) => ({
    code: l.code,
    label: l.native_name || l.name,
    flag: l.flag,
  }));
  return { languages, options, error, loading };
}

/**
 * Loads all languages including inactive ones (admin endpoint).
 */
export function useAdminLanguages() {
  const { data, error, loading, mutate } = useApiList<Language>("/core/admin/languages/");
  const languages: Language[] = data || [];
  const options: LanguageOption[] = languages.map((l) => ({
    code: l.code,
    label: l.native_name || l.name,
    flag: l.flag,
  }));
  return { languages, options, error, loading, mutate };
}

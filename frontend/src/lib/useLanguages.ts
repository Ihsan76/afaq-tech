"use client";

import { useApi, useApiList } from "@/lib/useApi";

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

const STATIC_LANGUAGES: Language[] = [
  { id: 1, code: "ar", name: "Arabic", native_name: "العربية", flag: "🇸🇦", is_rtl: true, is_active: true, is_default: true, order: 1 },
  { id: 2, code: "en", name: "English", native_name: "English", flag: "🇬🇧", is_rtl: false, is_active: true, is_default: false, order: 2 },
  { id: 3, code: "fr", name: "French", native_name: "Français", flag: "🇫🇷", is_rtl: false, is_active: true, is_default: false, order: 3 },
  { id: 4, code: "tr", name: "Turkish", native_name: "Türkçe", flag: "🇹🇷", is_rtl: false, is_active: true, is_default: false, order: 4 },
  { id: 5, code: "ur", name: "Urdu", native_name: "اردو", flag: "🇵🇰", is_rtl: true, is_active: true, is_default: false, order: 5 },
  { id: 6, code: "es", name: "Spanish", native_name: "Español", flag: "🇪🇸", is_rtl: false, is_active: true, is_default: false, order: 6 },
  { id: 7, code: "de", name: "German", native_name: "Deutsch", flag: "🇩🇪", is_rtl: false, is_active: true, is_default: false, order: 7 },
  { id: 8, code: "id", name: "Indonesian", native_name: "Bahasa Indonesia", flag: "🇮🇩", is_rtl: false, is_active: true, is_default: false, order: 8 },
  { id: 9, code: "bn", name: "Bengali", native_name: "বাংলা", flag: "🇧🇩", is_rtl: false, is_active: true, is_default: false, order: 9 },
];

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

export const locales = ["ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn", "fa"] as const;
export const defaultLocale = "en" as const;
export const localeNames: Record<string, string> = {
  ar: "العربية",
  en: "English",
  fr: "Français",
  tr: "Türkçe",
  ur: "اردو",
  es: "Español",
  de: "Deutsch",
  id: "Bahasa Indonesia",
  bn: "বাংলা",
  fa: "فارسی",
};
export const localeFlags: Record<string, string> = {
  ar: "🇸🇦",
  en: "🇬🇧",
  fr: "🇫🇷",
  tr: "🇹🇷",
  ur: "🇵🇰",
  es: "🇪🇸",
  de: "🇩🇪",
  id: "🇮🇩",
  bn: "🇧🇩",
  fa: "🇮🇷",
};
export const localeRtl: Record<string, boolean> = {
  ar: true,
  en: false,
  fr: false,
  tr: false,
  ur: true,
  es: false,
  de: false,
  id: false,
  bn: false,
  fa: true,
};

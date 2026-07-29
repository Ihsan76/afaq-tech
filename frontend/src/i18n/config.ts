export const locales = ["ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn"] as const;
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
};

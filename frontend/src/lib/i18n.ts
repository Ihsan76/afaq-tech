import { locales, defaultLocale } from "@/i18n/config";

export type Locale = (typeof locales)[number];

/**
 * Get a translated field value from a translations dict.
 * Fallback chain: locale → en → ar → fallback
 *
 * translations shape: { en: { title: "..." }, ar: { title: "..." }, fr: {} }
 */
export function localized(
  translations: Record<string, Record<string, string>> | undefined | null,
  locale: string,
  field: string,
  fallback = ""
): string {
  if (!translations || typeof translations !== "object") return fallback;
  return (
    translations[locale]?.[field] ||
    translations[defaultLocale]?.[field] ||
    translations["ar"]?.[field] ||
    fallback
  );
}

/**
 * Get a translated field from a content JSON block (nested locale keys).
 * content shape: { heading: { en: "...", ar: "..." }, show_particles: true }
 * Also supports: { translations: { heading: { en: "...", ar: "..." } }, ... }
 */
/**
 * Resolve a CMS-provided link into a locale-prefixed internal path.
 * Absolute URLs (http, https, mailto, tel, etc.) and hash links pass through unchanged.
 */
export function resolveLink(locale: string, raw?: string, fallback = "/"): string {
  const link = raw || fallback;
  if (!link) return fallback;
  if (link.startsWith("#")) return link;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(link)) return link;
  if (link.startsWith("//")) return link;
  if (link === `/${locale}` || link.startsWith(`/${locale}/`)) return link;
  if (link.startsWith("/")) return `/${locale}${link}`;
  return link;
}

export function localizedContent(
  content: Record<string, any> | undefined | null,
  field: string,
  locale: string,
  fallback = ""
): string {
  if (!content || typeof content !== "object") return fallback;

  // Check direct: content.heading.en
  let val = content[field];

  // Fallback: content.translations.heading.en
  if (!val || typeof val !== "object") {
    val = content.translations?.[field];
  }

  if (!val || typeof val !== "object") {
    // Non-localized field — return as-is (e.g. a plain string)
    return typeof val === "string" ? val : fallback;
  }
  return (
    val[locale] ||
    val[defaultLocale] ||
    val["ar"] ||
    fallback
  );
}

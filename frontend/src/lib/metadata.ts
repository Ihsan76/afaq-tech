import "server-only";
import type { Metadata } from "next";
import { API_URL } from "./api";
import { defaultLocale, locales } from "@/i18n/config";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.afaq.app";

const SITE_NAME = "آفاق تكنولوجي | Afaq Tech";

export function localizedValue(
  value: Record<string, string> | string | null | undefined,
  locale: string,
  fallback = ""
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return (
    value[locale] ||
    value.en ||
    value.ar ||
    fallback ||
    Object.values(value)[0] ||
    ""
  );
}

export function absoluteUrl(url?: string): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/")) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

interface PageMetaInput {
  locale: string;
  path: string;
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article" | "book";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  tags?: string[];
}

export function buildMetadata(input: PageMetaInput): Metadata {
  const {
    locale,
    path,
    title,
    description,
    image,
    type = "website",
    publishedTime,
    modifiedTime,
    authors,
    tags,
  } = input;

  const canonical = `${SITE_URL}/${locale}${path}`;
  const languages: Record<string, string> = { "x-default": `${SITE_URL}/${defaultLocale}${path}` };
  for (const loc of locales) {
    languages[loc] = loc === locale ? canonical : `${SITE_URL}/${loc}${path}`;
  }

  const ogImage = absoluteUrl(image);

  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      ...(tags && tags.length ? { tags } : {}),
      ...(authors && authors.length ? { authors } : {}),
    },
    robots: { index: true, follow: true },
    other: {
      "og:image:alt": title,
    },
  };
}

export async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface CmsPageSeo {
  title: string;
  description: string;
}

export async function getCmsPageSeo(
  locale: string,
  slug: string
): Promise<CmsPageSeo | null> {
  const page = await fetchJson<{
    title?: Record<string, string>;
    description?: Record<string, string>;
  }>(`/pages/${slug}/`);
  if (!page) return null;
  return {
    title: localizedValue(page.title, locale),
    description: localizedValue(page.description, locale),
  };
}

export async function getBlogPostSeo(locale: string, slug: string) {
  const post = await fetchJson<{
    title?: Record<string, string>;
    excerpt?: Record<string, string>;
    featured_image?: string;
    published_at?: string;
    tags?: string;
    author_name?: Record<string, string>;
  }>(`/blog/posts/${slug}/`);
  if (!post) return null;
  const tags = post.tags
    ? post.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  return {
    title: localizedValue(post.title, locale),
    description: localizedValue(post.excerpt, locale),
    image: post.featured_image,
    publishedTime: post.published_at,
    authors: [localizedValue(post.author_name, locale)],
    tags,
  };
}

export async function getEbookSeo(locale: string, slug: string) {
  const ebook = await fetchJson<{
    translations?: Record<string, Record<string, string>>;
    cover_image?: string;
    published_at?: string;
    author_translations?: Record<string, Record<string, string>>;
    tags?: string;
  }>(`/ebooks/${slug}/`);
  if (!ebook) return null;
  const title = localizedValue(ebook.translations?.["title"] as any, locale);
  const description = localizedValue(
    ebook.translations?.["description"] as any,
    locale
  );
  const author = localizedValue(
    ebook.author_translations?.["name"] as any,
    locale
  );
  const tags = ebook.tags
    ? ebook.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  return {
    title,
    description,
    image: ebook.cover_image,
    publishedTime: ebook.published_at,
    authors: [author],
    tags,
  };
}

export async function getCourseSeo(locale: string, slug: string) {
  const course = await fetchJson<{
    title?: Record<string, string>;
    description?: Record<string, string>;
    thumbnail?: string;
    instructor_name?: Record<string, string>;
  }>(`/courses/${slug}/`);
  if (!course) return null;
  return {
    title: localizedValue(course.title, locale),
    description: localizedValue(course.description, locale),
    image: course.thumbnail,
    authors: [localizedValue(course.instructor_name, locale)],
  };
}

export async function getServiceSeo(locale: string, id: number) {
  const service = await fetchJson<{
    title?: Record<string, string>;
    description?: Record<string, string>;
    cover_image?: string;
    image?: string;
  }>(`/marketplace/services/${id}/`);
  if (!service) return null;
  return {
    title: localizedValue(service.title, locale),
    description: localizedValue(service.description, locale),
    image: service.cover_image || service.image,
  };
}

export async function getCurriculumSeo(
  locale: string,
  gradeId?: string,
  subjectId?: string
) {
  if (gradeId && subjectId) {
    const subject = await fetchJson<{
      name?: Record<string, string>;
      grade?: number;
    }>(`/academics/subjects/${subjectId}/`);
    const grade = await fetchJson<{ name?: Record<string, string> }>(
      `/academics/grades/${gradeId}/`
    );
    return {
      title: [
        localizedValue(subject?.name, locale),
        localizedValue(grade?.name, locale),
      ].filter(Boolean).join(" — "),
      description: localizedValue(subject?.name, locale),
    };
  }
  if (gradeId) {
    const grade = await fetchJson<{ name?: Record<string, string> }>(
      `/academics/grades/${gradeId}/`
    );
    return {
      title: localizedValue(grade?.name, locale),
      description: "",
    };
  }
  return null;
}

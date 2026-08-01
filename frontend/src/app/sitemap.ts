import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afaq.app";

const STATIC_PAGES = [
  "",
  "/academy",
  "/curriculum",
  "/blog",
  "/ebooks",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/search",
];

async function fetchPages(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1"}/pages/admin/pages/`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.results || data;
    return pages
      .filter((p: any) => p.is_published && !p.is_homepage)
      .map((p: any) => `/${p.slug}`);
  } catch {
    return [];
  }
}

async function fetchBlogPosts(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1"}/blog/posts/?locale=en`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((p: any) => `/blog/${p.slug}`);
  } catch {
    return [];
  }
}

async function fetchEbooks(): Promise<string[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1"}/ebooks/?locale=en`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((e: any) => `/ebooks/${e.slug}`);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [dynamicPages, blogPosts, ebooks] = await Promise.all([
    fetchPages(),
    fetchBlogPosts(),
    fetchEbooks(),
  ]);

  const allPaths = [...new Set([...STATIC_PAGES, ...dynamicPages])];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" ? 1.0 : 0.8,
      });
    }
  }

  for (const slug of blogPosts) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  for (const slug of ebooks) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

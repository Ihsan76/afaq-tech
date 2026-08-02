import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://afaq.app";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";

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

async function fetchJson(path: string, revalidate = 3600): Promise<any> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMenuPaths(): Promise<string[]> {
  const [header, footer] = await Promise.all([
    fetchJson("/pages/menu/header/?locale=en"),
    fetchJson("/pages/menu/footer/?locale=en"),
  ]);
  const items = [...(header ?? []), ...(footer ?? [])];
  const paths = new Set<string>();
  const collect = (node: any) => {
    const url = node.resolved_url || node.url || "";
    if (typeof url === "string" && url.startsWith("/") && !url.startsWith("/admin/")) {
      paths.add(url);
    }
    for (const child of node.children || []) collect(child);
  };
  for (const item of items) collect(item);
  return [...paths];
}

async function fetchGradePaths(): Promise<string[]> {
  const data = await fetchJson("/academics/grades/?locale=en");
  const grades = data?.results || data || [];
  return (grades as any[]).map((g: any) => `/curriculum/${g.id}`);
}

async function fetchBlogPaths(): Promise<string[]> {
  const data = await fetchJson("/blog/posts/?locale=en");
  return ((data?.results || data || []) as any[])
    .filter((p: any) => p.slug)
    .map((p: any) => p.slug);
}

async function fetchEbookPaths(): Promise<string[]> {
  const data = await fetchJson("/ebooks/?locale=en");
  return ((data?.results || data || []) as any[])
    .filter((e: any) => e.slug)
    .map((e: any) => e.slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [menuPaths, gradePaths, blogPosts, ebookPosts] = await Promise.all([
    fetchMenuPaths(),
    fetchGradePaths(),
    fetchBlogPaths(),
    fetchEbookPaths(),
  ]);

  const allPaths = [...new Set([...STATIC_PAGES, ...menuPaths, ...gradePaths])];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const path of allPaths) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${path === "/" ? "" : path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: path === "" || path === "/" ? 1.0 : 0.8,
      });
    }
  }

  for (const slug of blogPosts) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  for (const slug of ebookPosts) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/ebooks/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}

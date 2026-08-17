import { notFound, redirect, RedirectType } from "next/navigation";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getCmsPageSeo } from "@/lib/metadata";
import CatchAllPageClient from "./page-client";

const RESERVED_PREFIXES = [
  "login", "register", "auth", "verify-email", "admin", "lesson-plans", "profile", "chat",
  "curriculum", "academy", "ebooks", "blog", "dashboard",
  "forgot-password", "reset-password", "search", "marketplace", "gamification",
  "privacy", "terms", "school",
];

const REDIRECTS: Record<string, string> = {
  "school-followup": "school",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageSlug = Array.isArray(slug) ? slug.join("/") : slug || "";
  const seo = await getCmsPageSeo(locale, pageSlug);
  if (!seo) {
    return buildMetadata({
      locale,
      path: `/${pageSlug}`,
      title: "404",
      description: "Page not found",
    });
  }
  return buildMetadata({
    locale,
    path: `/${pageSlug}`,
    title: seo.title,
    description: seo.description,
  });
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const pageSlug = Array.isArray(slug) ? slug.join("/") : slug || "";
  const firstSegment = pageSlug.split("/")[0];

  if (firstSegment in REDIRECTS) {
    const rest = pageSlug.slice(firstSegment.length);
    redirect(`/${locale}/${REDIRECTS[firstSegment]}${rest}`, RedirectType.replace);
  }

  if (RESERVED_PREFIXES.includes(firstSegment)) {
    notFound();
  }

  const seo = await getCmsPageSeo(locale, pageSlug);

  return (
    <>
      {seo && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: seo.title,
            description: seo.description,
            url: `${SITE_URL}/${locale}/${pageSlug}`,
            inLanguage: locale,
          }}
        />
      )}
      <CatchAllPageClient slug={pageSlug} />
    </>
  );
}

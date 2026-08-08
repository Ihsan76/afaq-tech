import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import SearchPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/search",
    title: localizedValue({ ar: "البحث", en: "Search" }, locale),
    description: localizedValue(
      { ar: "ابحث في الدورات والمقالات والكتب", en: "Search courses, articles, and books" },
      locale
    ),
    type: "website",
  });
}

export default async function SearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "البحث", en: "Search" }, locale),
    url: `${SITE_URL}/${locale}/search`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SearchPageClient />
    </>
  );
}

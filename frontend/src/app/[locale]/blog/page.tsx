import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import BlogPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/blog",
    title: localizedValue({ ar: "المدوّنة", en: "Blog" }, locale),
    description: localizedValue(
      { ar: "مقالات وموارد تعليمية من آفاق تكنولوجي", en: "Educational articles and resources from Afaq Tech" },
      locale
    ),
    type: "website",
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: localizedValue({ ar: "مدوّنة آفاق", en: "Afaq Blog" }, locale),
    url: `${SITE_URL}/${locale}/blog`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogPageClient />
    </>
  );
}

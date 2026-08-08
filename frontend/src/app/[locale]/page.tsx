import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getCmsPageSeo, localizedValue } from "@/lib/metadata";
import HomePageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = await getCmsPageSeo(locale, "homepage");

  return buildMetadata({
    locale,
    path: "/",
    title: seo?.title || `${localizedValue({ ar: "آفاق تكنولوجي", en: "Afaq Tech" }, locale)} — ${localizedValue({ ar: "منصة رقمية", en: "Digital Platform" }, locale)}`,
    description: seo?.description,
    type: "website",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const seo = await getCmsPageSeo(locale, "homepage");
  const title = seo?.title || localizedValue({ ar: "آفاق تكنولوجي", en: "Afaq Tech" }, locale);
  const description = seo?.description || localizedValue({ ar: "منصة تعليمية رقمية شاملة", en: "A comprehensive digital education platform" }, locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "آفاق تكنولوجي | Afaq Tech",
    url: SITE_URL,
    description,
    inLanguage: [locale],
    publisher: {
      "@type": "Organization",
      name: "آفاق تكنولوجي",
      url: SITE_URL,
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomePageClient />
    </>
  );
}

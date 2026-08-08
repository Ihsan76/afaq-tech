import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import MarketplacePageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/marketplace",
    title: localizedValue({ ar: "سوق الخدمات", en: "Services Marketplace" }, locale),
    description: localizedValue(
      { ar: "سوق خدمات آفاق: حصص، خدمات تعليمية واحترافية", en: "Afaq marketplace: lessons, educational and professional services" },
      locale
    ),
    type: "website",
  });
}

export default async function MarketplacePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "سوق الخدمات", en: "Services Marketplace" }, locale),
    url: `${SITE_URL}/${locale}/marketplace`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <MarketplacePageClient />
    </>
  );
}

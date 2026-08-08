import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import EbooksPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/ebooks",
    title: localizedValue({ ar: "الكتب الإلكترونية", en: "E-books" }, locale),
    description: localizedValue(
      { ar: "مكتبة الكتب الإلكترونية التعليمية من آفاق تكنولوجي", en: "Educational e-book library from Afaq Tech" },
      locale
    ),
    type: "website",
  });
}

export default async function EbooksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: localizedValue({ ar: "الكتب الإلكترونية", en: "E-books" }, locale),
    url: `${SITE_URL}/${locale}/ebooks`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <EbooksPageClient />
    </>
  );
}

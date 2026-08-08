import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import SchoolPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/school",
    title: localizedValue({ ar: "آفاق مدرستي", en: "Afaq Madrasti" }, locale),
    description: localizedValue(
      { ar: "منصة آفاق مدرستي: إدارة المدرسة والمتابعة اليومية", en: "Afaq Madrasti: school management and daily follow-up" },
      locale
    ),
    type: "website",
  });
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "آفاق مدرستي", en: "Afaq Madrasti" }, locale),
    url: `${SITE_URL}/${locale}/school`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SchoolPageClient />
    </>
  );
}

import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import LessonPlansPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/lesson-plans",
    title: localizedValue({ ar: "خطط الدروس", en: "Lesson Plans" }, locale),
    description: localizedValue(
      { ar: "توليد خطط دروس بالذكاء الاصطناعي", en: "Generate lesson plans with AI" },
      locale
    ),
    type: "website",
  });
}

export default async function LessonPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "خطط الدروس", en: "Lesson Plans" }, locale),
    url: `${SITE_URL}/${locale}/lesson-plans`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LessonPlansPageClient />
    </>
  );
}

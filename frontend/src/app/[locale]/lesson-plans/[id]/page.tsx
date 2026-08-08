import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import LessonPlanDetailPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  return buildMetadata({
    locale,
    path: `/lesson-plans/${id}`,
    title: localizedValue({ ar: "خطة درس", en: "Lesson Plan" }, locale),
    description: localizedValue(
      { ar: "خطة درس مولّدة بالذكاء الاصطناعي", en: "AI-generated lesson plan" },
      locale
    ),
  });
}

export default async function LessonPlanDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: localizedValue({ ar: "خطة درس", en: "Lesson Plan" }, locale),
    url: `${SITE_URL}/${locale}/lesson-plans/${id}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <LessonPlanDetailPageClient />
    </>
  );
}

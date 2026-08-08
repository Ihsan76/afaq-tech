import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, getCourseSeo } from "@/lib/metadata";
import CourseDetailPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const seo = await getCourseSeo(locale, slug);
  if (!seo) {
    return buildMetadata({
      locale,
      path: `/academy/courses/${slug}`,
      title: "404",
      description: "Course not found",
    });
  }
  return buildMetadata({
    locale,
    path: `/academy/courses/${slug}`,
    title: seo.title,
    description: seo.description,
    image: seo.image,
    authors: seo.authors,
  });
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const seo = await getCourseSeo(locale, slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: seo?.title || "",
    description: seo?.description || "",
    ...(seo?.image ? { image: seo.image } : {}),
    ...(seo?.authors?.[0]
      ? {
          provider: {
            "@type": "Organization",
            name: seo.authors[0],
          },
        }
      : {}),
    url: `${SITE_URL}/${locale}/academy/courses/${slug}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <CourseDetailPageClient />
    </>
  );
}

import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
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
      { ar: "ابحث عن الدورات والكتب والمقالات والمزيد", en: "Search courses, ebooks, articles and more" },
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
  return <SearchPageClient />;
}

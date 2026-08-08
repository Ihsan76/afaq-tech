import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, buildMetadata, localizedValue } from "@/lib/metadata";
import SubscriptionsPageClient from "./page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/subscriptions",
    title: localizedValue({ ar: "الباقات والاشتراكات", en: "Subscriptions & Plans" }, locale),
    description: localizedValue(
      { ar: "باقات واشتراكات منصة آفاق", en: "Afaq platform plans and subscriptions" },
      locale
    ),
    type: "website",
  });
}

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: localizedValue({ ar: "الباقات والاشتراكات", en: "Subscriptions & Plans" }, locale),
    url: `${SITE_URL}/${locale}/subscriptions`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SubscriptionsPageClient />
    </>
  );
}

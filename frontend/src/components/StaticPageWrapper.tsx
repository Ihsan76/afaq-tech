import JsonLd from "./JsonLd";
import { SITE_URL } from "@/lib/metadata";

export default function StaticPageWrapper({
  locale,
  path,
  title,
  description,
  jsonLdType = "WebPage",
  children,
}: {
  locale: string;
  path: string;
  title: string;
  description?: string;
  jsonLdType?: string;
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": jsonLdType,
    name: title,
    ...(description ? { description } : {}),
    url: `${SITE_URL}/${locale}${path}`,
    inLanguage: locale,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {children}
    </>
  );
}

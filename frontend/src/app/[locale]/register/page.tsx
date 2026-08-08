import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import RegisterPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "إنشاء حساب",
  en: "Register",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/register",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "أنشئ حسابك الجديد في منصة آفاق", en: "Create your new Afaq platform account" },
      locale
    ),
  });
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/register"
      title={localizedValue(TITLES, locale)}
    >
      <RegisterPageClient />
    </StaticPageWrapper>
  );
}

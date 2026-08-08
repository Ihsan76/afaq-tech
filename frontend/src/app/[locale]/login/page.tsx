import type { Metadata } from "next";
import { buildMetadata, localizedValue } from "@/lib/metadata";
import StaticPageWrapper from "@/components/StaticPageWrapper";
import LoginPageClient from "./page-client";

const TITLES: Record<string, string> = {
  ar: "تسجيل الدخول",
  en: "Login",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildMetadata({
    locale,
    path: "/login",
    title: localizedValue(TITLES, locale),
    description: localizedValue(
      { ar: "تسجيل الدخول إلى حسابك في منصة آفاق", en: "Log in to your Afaq platform account" },
      locale
    ),
  });
}

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <StaticPageWrapper
      locale={locale}
      path="/login"
      title={localizedValue(TITLES, locale)}
    >
      <LoginPageClient />
    </StaticPageWrapper>
  );
}

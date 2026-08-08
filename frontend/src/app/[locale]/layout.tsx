import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { locales, localeNames } from "@/i18n/config";
import NavbarWrapper from "@/components/NavbarWrapper";
import ContextualSidebar from "@/components/ContextualSidebar";
import Footer from "@/components/Footer";
import HtmlAttrs from "@/components/HtmlAttrs";
import ChatWidget from "@/components/ChatWidget";
import KeepAlive from "@/components/KeepAlive";
import TranslationProvider from "@/components/TranslationProvider";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const languages: Record<string, string> = { "x-default": "/" };
  for (const loc of locales) {
    languages[loc] = `/${loc}`;
  }

  return {
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
    openGraph: {
      type: "website",
      locale,
      alternateLocale: [...locales],
      siteName: "آفاق تكنولوجي | Afaq Tech",
    },
    title: {
      default: `${localeNames[locale] || locale} — آفاق تكنولوجي | Afaq Tech`,
      template: "%s | آفاق تكنولوجي",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <>
      <HtmlAttrs locale={locale} />
      <NextIntlClientProvider messages={messages}>
        <TranslationProvider locale={locale} messages={messages}>
          <NavbarWrapper />
          <div className="flex min-h-[calc(100vh-4rem)]">
            <ContextualSidebar />
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
          {/* Footer */}
          <Footer />
          <ChatWidget />
          <KeepAlive />
        </TranslationProvider>
      </NextIntlClientProvider>
    </>
  );
}

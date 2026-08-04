import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.afaq.app";
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "آفاق تكنولوجي | Afaq Tech",
      url: BASE_URL,
      description:
        "منصة رقمية متخصصة في الخدمات الرقمية والتعليم بالذكاء الاصطناعي",
    },
    {
      "@type": "WebSite",
      name: "آفاق تكنولوجي | Afaq Tech",
      url: BASE_URL,
      inLanguage: ["ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn", "fa"],
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "آفاق تكنولوجي | Afaq Tech",
    template: "%s | آفاق تكنولوجي",
  },
  description: "منصة رقمية متخصصة في الخدمات الرقمية والتعليم بالذكاء الاصطناعي — تصميم مواقع، إدارة تسويق، أكاديمية، كتب إلكترونية",
  keywords: ["آفاق تكنولوجي", "Afaq Tech", "تصميم مواقع", "تسويق رقمي", "تعليم", "ذكاء اصطناعي", "كتب إلكترونية", "أكاديمية"],
  authors: [{ name: "Afaq Tech" }],
  openGraph: {
    type: "website",
    locale: "ar",
    siteName: "آفاق تكنولوجي | Afaq Tech",
    title: "آفاق تكنولوجي | Afaq Tech",
    description: "منصة رقمية متخصصة في الخدمات الرقمية والتعليم بالذكاء الاصطناعي",
  },
  twitter: {
    card: "summary_large_image",
    title: "آفاق تكنولوجي | Afaq Tech",
    description: "منصة رقمية متخصصة في الخدمات الرقمية والتعليم بالذكاء الاصطناعي",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

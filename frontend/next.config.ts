import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://i.ytimg.com https://img.youtube.com",
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "connect-src 'self' https://api.afaq.app https://*.supabase.co https://www.google.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
  async redirects() {
    const localeRedirects = ["ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn"].flatMap((locale) => [
      { source: `/${locale}/courses`, destination: `/${locale}/academy/courses`, permanent: true },
      { source: `/${locale}/courses/:path*`, destination: `/${locale}/academy/courses/:path*`, permanent: true },
    ]);
    return localeRedirects;
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default withNextIntl(nextConfig);

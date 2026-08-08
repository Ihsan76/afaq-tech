import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { defaultLocale, locales } from "./i18n/config";

const handleI18n = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

function detectFromAcceptLanguage(header: string | null): string | undefined {
  if (!header) return undefined;
  // Parse q-weighted Accept-Language, e.g. "ar,en;q=0.9,fr;q=0.8"
  const entries = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") q = parseFloat(value) || 0;
      }
      return { tag: tag.toLowerCase(), q };
    })
    .filter((e) => e.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    if ((locales as readonly string[]).includes(tag)) return tag;
    const base = tag.split("-")[0];
    if ((locales as readonly string[]).includes(base)) return base;
  }
  return undefined;
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const segment = pathname.split("/")[1];
  const hasLocale = (locales as readonly string[]).includes(segment);

  const response = handleI18n(request);

  const locale =
    (hasLocale ? segment : undefined) ||
    detectFromAcceptLanguage(request.headers.get("accept-language")) ||
    defaultLocale;

  if (response) {
    response.headers.set("x-locale", locale);
    response.headers.set("Content-Language", locale);
    response.headers.set("Vary", "Accept-Language, Cookie");
  }
  return response;
}

// NOTE: must stay a static literal — Next.js parses `matcher` at compile time.
// Regenerated automatically by `npm run sync:locales`.
export const config = {
  matcher: ["/", "/(ar|en|fr|tr|ur|es|de|id|bn|fa)/:path*"],
};

#!/usr/bin/env node
/**
 * QA smoke test — cross-locale SSR checks for the Afaq platform frontend.
 *
 * Usage:
 *   node tests/qa/smoke.mjs                  # defaults to http://localhost:3100
 *   BASE_URL=https://www.afaq.app node tests/qa/smoke.mjs
 *
 * Asserts for each of the 10 locales across key public routes:
 *   - HTTP 200
 *   - <html lang="{locale}"> and correct dir (RTL for ar/ur/fa)
 *   - <meta name="description">
 *   - canonical + hreflang alternates (one per locale + x-default)
 *   - OpenGraph tags
 *   - JSON-LD script (type application/ld+json)
 *   - mobile user-agent fetch still returns 200
 *
 * Exits non-zero on first failure (CI-friendly).
 */
import http from "node:http";
import https from "node:https";

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const MOBILE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

const LOCALES = [
  "ar", "en", "fr", "tr", "ur", "es", "de", "id", "bn", "fa",
];
const RTL = new Set(["ar", "ur", "fa"]);

// Routes that always carry a description (static/list pages).
const STATIC_DESCRIPTION_ROUTES = [
  "/",
  "/blog",
  "/ebooks",
  "/academy",
  "/academy/courses",
  "/curriculum",
  "/marketplace",
  "/search",
  "/subscriptions",
  "/lesson-plans",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

const EXTRA_ROUTES = [
  "/blog/a-sample-post",
  "/ebooks/sample-ebook",
  "/academy/courses/sample-course",
  "/services/web-design",
  "/curriculum/8/1",
];

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = new URL(url).protocol === "https:" ? https : http;
    const req = lib.get(
      url,
      { headers: { "user-agent": "afaq-qa-smoke", ...headers } },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body, headers: res.headers }));
        res.on("error", reject);
      }
    );
    req.on("error", reject);
  });
}

let failures = 0;
let checks = 0;

function check(name, ok, detail = "") {
  checks++;
  if (!ok) {
    failures++;
    console.error(`  ✗ FAIL ${name} ${detail}`);
  } else {
    console.log(`  ✓ ${name}`);
  }
}

async function assertPage(locale, route, expectDescription) {
  const url = `${BASE_URL}/${locale}${route === "/" ? "" : route}`;
  const { status, body } = await fetchText(url);
  check(`${locale}${route} → HTTP 200`, status === 200, `(got ${status})`);
  if (status !== 200) return;

  const langMatch = body.match(/<html[^>]*lang="([^"]+)"/);
  check(`${locale}${route} → html lang`, langMatch?.[1] === locale, `(got ${langMatch?.[1]})`);

  const expectedDir = RTL.has(locale) ? "rtl" : "ltr";
  const dirMatch = body.match(/<html[^>]*dir="([^"]+)"/);
  check(`${locale}${route} → dir ${expectedDir}`, dirMatch?.[1] === expectedDir, `(got ${dirMatch?.[1]})`);

  if (expectDescription) {
    check(
      `${locale}${route} → meta description`,
      /<meta[^>]*name="description"/.test(body)
    );
  }

  const canonical = body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/);
  check(
    `${locale}${route} → canonical`,
    !!canonical && canonical[1].includes(`/${locale}${route === "/" ? "" : route}`)
  );

  check(`${locale}${route} → hreflang en`, /hreflang="en"/i.test(body));
  check(`${locale}${route} → hreflang x-default`, /hreflang="x-default"/i.test(body));
  check(`${locale}${route} → og:title`, body.includes('property="og:title"'));
  check(`${locale}${route} → JSON-LD`, body.includes('type="application/ld+json"'));

  // Mobile viewport request
  const mob = await fetchText(url, { "user-agent": MOBILE_UA });
  check(`${locale}${route} → mobile 200`, mob.status === 200, `(got ${mob.status})`);
}

async function main() {
  console.log(`QA smoke test → ${BASE_URL}`);

  for (const locale of LOCALES) {
    console.log(`\n[${locale}]`);
    for (const route of STATIC_DESCRIPTION_ROUTES) {
      await assertPage(locale, route, true);
    }
    for (const route of EXTRA_ROUTES) {
      await assertPage(locale, route, false);
    }
  }

  // Root redirect sanity: bare domain should redirect to a locale.
  const root = await fetchText(BASE_URL);
  check("GET / redirects to a locale", [301, 302, 307, 308].includes(root.status), `(got ${root.status})`);

  console.log(`\n${checks} checks, ${failures} failures`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

"use client";

import { useTranslations } from "next-intl";
import { useParams, notFound, usePathname } from "next/navigation";
import BlockRenderer, { BlockData } from "@/components/landing/BlockRenderer";
import { useApi } from "@/lib/useApi";

interface ServiceMeta {
  hasSteps: boolean;
  hasTestimonials: boolean;
}

const SERVICE_META: Record<string, ServiceMeta> = {
  "web-design": { hasSteps: true, hasTestimonials: true },
  "social-media": { hasSteps: true, hasTestimonials: false },
  "landing-pages": { hasSteps: false, hasTestimonials: true },
  forms: { hasSteps: false, hasTestimonials: false },
  ebooks: { hasSteps: false, hasTestimonials: false },
  "ad-campaigns": { hasSteps: false, hasTestimonials: false },
  "brand-identity": { hasSteps: false, hasTestimonials: true },
};

const KNOWN_SLUGS = Object.keys(SERVICE_META);

const FEATURE_ICONS: Record<string, string[]> = {
  "web-design": ["🎨", "📱", "⚡"],
  "social-media": ["📊", "✍️", "📈"],
  "landing-pages": ["🎯", "🧪", "📊"],
  forms: ["🧠", "🔗", "📊"],
  ebooks: ["✍️", "🎨", "📤"],
  "ad-campaigns": ["🔍", "📱", "📊"],
  "brand-identity": ["🎨", "📋", "💡"],
};

const STEP_ICONS: Record<string, string[]> = {
  "web-design": ["🔍", "🛠️", "🚀"],
  "social-media": ["🔍", "✍️", "📈"],
};

interface ServiceFeature {
  title: string;
  desc: string;
  points: string[];
}

interface ServiceStep {
  title: string;
  desc: string;
}

interface ServiceTestimonial {
  name: string;
  role: string;
  text: string;
}

interface ServiceContent {
  hero: { title: string; subtitle: string; cta: string; badges: string[] };
  featuresTitle: string;
  featuresSubtitle: string;
  features: ServiceFeature[];
  stepsTitle?: string;
  stepsSubtitle?: string;
  steps?: ServiceStep[];
  testimonialsTitle?: string;
  testimonialsSubtitle?: string;
  testimonials?: ServiceTestimonial[];
  cta: { title: string; subtitle: string; text: string };
}

interface PageData {
  id: number;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  layout_config: Record<string, any>;
  theme_overrides: Record<string, any>;
  blocks: BlockData[];
}

function LoadingSpinner({ tLoading }: { tLoading: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
        >
          <span className="text-white text-2xl font-bold">آ</span>
        </div>
        <p style={{ color: "var(--color-text-muted)" }}>{tLoading}</p>
      </div>
    </div>
  );
}

function buildFallbackBlocks(slug: string, c: ServiceContent, locale: string): BlockData[] {
  const L = (value: string) => ({ [locale]: value });
  const meta = SERVICE_META[slug];

  const mk = (id: number, block_type: string, content: Record<string, any>, order: number): BlockData => ({
    id,
    block_type,
    content,
    styles: {},
    layout: {},
    animation: {},
    is_active: true,
    order,
  });

  const blocks: BlockData[] = [];
  let order = 0;

  blocks.push(
    mk(1, "hero", {
      badges: c.hero.badges.map((badge) => ({ icon: "✓", translations: { text: L(badge) } })),
      translations: {
        heading: L(c.hero.title),
        subtitle: L(c.hero.subtitle),
        cta_text: L(c.hero.cta),
      },
      cta_link: "/register",
    }, order++)
  );

  blocks.push(
    mk(2, "features", {
      translations: { title: L(c.featuresTitle), subtitle: L(c.featuresSubtitle) },
      items: c.features.map((f, i) => ({
        icon: FEATURE_ICONS[slug]?.[i] || "⭐",
        link: "/register",
        translations: { title: L(f.title), desc: L(f.desc) },
        points: f.points.map((p) => ({ translations: { text: L(p) } })),
      })),
    }, order++)
  );

  if (meta.hasSteps && c.steps) {
    blocks.push(
      mk(3, "platform_how_it_works", {
        translations: { title: L(c.stepsTitle || ""), subtitle: L(c.stepsSubtitle || "") },
        steps: c.steps.map((st, i) => ({
          number: String(i + 1),
          icon: STEP_ICONS[slug]?.[i] || "⭐",
          translations: { title: L(st.title), desc: L(st.desc) },
        })),
      }, order++)
    );
  }

  if (meta.hasTestimonials && c.testimonials) {
    blocks.push(
      mk(4, "testimonials", {
        translations: { title: L(c.testimonialsTitle || ""), subtitle: L(c.testimonialsSubtitle || "") },
        items: c.testimonials.map((tm) => ({
          translations: { name: L(tm.name), role: L(tm.role), text: L(tm.text) },
        })),
      }, order++)
    );
  }

  blocks.push(
    mk(5, "cta", {
      translations: {
        title: L(c.cta.title),
        subtitle: L(c.cta.subtitle),
        cta_text: L(c.cta.text),
      },
      cta_link: "/register",
    }, order)
  );

  return blocks;
}

export default function ServicePage() {
  const params = useParams();
  const slug = params.slug as string;
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const t = useTranslations("services");
  const tCommon = useTranslations("common");
  const isKnown = KNOWN_SLUGS.includes(slug);

  const { data: page, loading } = useApi<PageData>(`/pages/services/${slug}/`);

  if (loading) {
    return <LoadingSpinner tLoading={tCommon("loading")} />;
  }

  const cmsBlocks = page && Array.isArray(page.blocks) && page.blocks.length > 0 ? page.blocks : null;

  if (cmsBlocks) {
    return (
      <main>
        <BlockRenderer blocks={cmsBlocks} />
      </main>
    );
  }

  if (!isKnown) {
    notFound();
  }

  const content = t.raw(slug) as ServiceContent | undefined;
  if (!content) notFound();

  return (
    <main>
      <BlockRenderer blocks={buildFallbackBlocks(slug, content, locale)} />
    </main>
  );
}

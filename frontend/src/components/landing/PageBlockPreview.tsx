"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

interface BlockData {
  id: number;
  block_type: string;
  content?: Record<string, any>;
  styles?: Record<string, any>;
  layout?: Record<string, any>;
  animation?: Record<string, any>;
  is_active?: boolean;
  order?: number;
}

const BLOCK_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: dynamic(() => import("@/components/landing/HeroSection"), { ssr: false }),
  platform_hero: dynamic(() => import("@/components/landing/PlatformHero"), { ssr: false }),
  stats: dynamic(() => import("@/components/landing/StatsBar"), { ssr: false }),
  platform_stats: dynamic(() => import("@/components/landing/PlatformStats"), { ssr: false }),
  features: dynamic(() => import("@/components/landing/FeaturesSection"), { ssr: false }),
  how_it_works: dynamic(() => import("@/components/landing/HowItWorks"), { ssr: false }),
  platform_how_it_works: dynamic(() => import("@/components/landing/PlatformHowItWorks"), { ssr: false }),
  services_showcase: dynamic(() => import("@/components/landing/ServicesShowcase"), { ssr: false }),
  demo: dynamic(() => import("@/components/landing/DemoShowcase"), { ssr: false }),
  testimonials: dynamic(() => import("@/components/landing/Testimonials"), { ssr: false }),
  pricing: dynamic(() => import("@/components/landing/PricingSection"), { ssr: false }),
  faq: dynamic(() => import("@/components/landing/FAQSection"), { ssr: false }),
  cta: dynamic(() => import("@/components/landing/CTAFooter"), { ssr: false }),
  grade_showcase: dynamic(() => import("@/components/landing/GradeShowcase"), { ssr: false }),
  subjects_grid: dynamic(() => import("@/components/landing/SubjectsGrid"), { ssr: false }),
  partners: dynamic(() => import("@/components/landing/PartnersBar"), { ssr: false }),
  portfolio: dynamic(() => import("@/components/landing/PortfolioShowcase"), { ssr: false }),
  accordion: dynamic(() => import("@/components/landing/AccordionSection"), { ssr: false }),
  tabs: dynamic(() => import("@/components/landing/TabsSection"), { ssr: false }),
  timeline: dynamic(() => import("@/components/landing/TimelineSection"), { ssr: false }),
  countdown: dynamic(() => import("@/components/landing/CountdownSection"), { ssr: false }),
  newsletter: dynamic(() => import("@/components/landing/NewsletterSection"), { ssr: false }),
  map: dynamic(() => import("@/components/landing/MapSection"), { ssr: false }),
  table: dynamic(() => import("@/components/landing/TableSection"), { ssr: false }),
  icon_list: dynamic(() => import("@/components/landing/IconListSection"), { ssr: false }),
  logo_carousel: dynamic(() => import("@/components/landing/LogoCarouselSection"), { ssr: false }),
  download: dynamic(() => import("@/components/landing/DownloadSection"), { ssr: false }),
  code: dynamic(() => import("@/components/landing/CodeSection"), { ssr: false }),
  blog_list: dynamic(() => import("@/components/landing/BlogListBlock"), { ssr: false }),
  contact: dynamic(() => import("@/components/landing/ContactSection"), { ssr: false }),
  chat_greeting: dynamic(() => import("@/components/landing/ChatGreeting"), { ssr: false }),
};

function BlockLoadingPlaceholder() {
  return (
    <div className="py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
      <div className="inline-block w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-primary)", borderRightColor: "transparent" }} />
    </div>
  );
}

export default function PageBlockPreview({
  blocks,
  themeOverrides,
  scale = 1,
  className = "",
}: {
  blocks: BlockData[];
  themeOverrides?: Record<string, string>;
  scale?: number;
  className?: string;
}) {
  const t = useTranslations("common");
  const sorted = [...blocks]
    .filter((b) => b.is_active !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (sorted.length === 0) {
    return (
      <div className={`text-center py-16 rounded-2xl border border-dashed ${className}`} style={{ borderColor: "var(--color-border)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>{t("noBlocksPreview")}</p>
      </div>
    );
  }

  const wrapperStyle: React.CSSProperties = {
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: "top left",
    ...(themeOverrides ? Object.fromEntries(
      Object.entries(themeOverrides).map(([k, v]) => [`--color-${k}`, v])
    ) : {}),
  };

  return (
    <div className={`overflow-hidden ${className}`} style={wrapperStyle}>
      <div className="preview-scale-wrapper">
        {sorted.map((block) => {
          const Component = BLOCK_COMPONENTS[block.block_type];
          if (!Component) {
            return (
              <div key={block.id} className="py-6 px-4 my-2 rounded-xl border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{t("unknownBlock")}: {block.block_type}</p>
              </div>
            );
          }

          const blockStyle: React.CSSProperties = {};
          if (block.styles?.background) blockStyle.background = block.styles.background;
          if (block.styles?.padding) blockStyle.padding = block.styles.padding;
          if (block.styles?.text_color) blockStyle.color = block.styles.text_color;

          return (
            <div key={block.id} style={blockStyle}>
              <Component
                content={block.content}
                styles={block.styles}
                layout={block.layout}
                animation={block.animation}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

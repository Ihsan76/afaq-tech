"use client";

import dynamic from "next/dynamic";

export interface BlockData {
  id: number;
  block_type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
  layout: Record<string, any>;
  animation: Record<string, any>;
  is_active: boolean;
  order: number;
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

function applyStyles(block: BlockData): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (block.styles?.background) s.background = block.styles.background;
  if (block.styles?.padding) s.padding = block.styles.padding;
  if (block.styles?.text_color) s.color = block.styles.text_color;
  if (block.styles?.max_width) s.maxWidth = block.styles.max_width;
  return s;
}

export default function BlockRenderer({ blocks }: { blocks: BlockData[] }) {
  const sorted = [...blocks].filter((b) => b.is_active).sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((block) => {
        const Component = BLOCK_COMPONENTS[block.block_type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.block_type}`);
          return null;
        }

        const blockStyles = applyStyles(block);

        return (
          <div key={block.id} style={blockStyles}>
            <Component
              content={block.content}
              styles={block.styles}
              layout={block.layout}
              animation={block.animation}
            />
          </div>
        );
      })}
    </>
  );
}

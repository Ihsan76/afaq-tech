"use client";

import dynamic from "next/dynamic";
import { WidgetData } from "@/types/widget";

const WIDGET_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: dynamic(() => import("@/components/landing/HeroSection"), { ssr: false }),
  stats: dynamic(() => import("@/components/landing/StatsBar"), { ssr: false }),
  features: dynamic(() => import("@/components/landing/FeaturesSection"), { ssr: false }),
  how_it_works: dynamic(() => import("@/components/landing/HowItWorks"), { ssr: false }),
  demo: dynamic(() => import("@/components/landing/DemoShowcase"), { ssr: false }),
  testimonials: dynamic(() => import("@/components/landing/Testimonials"), { ssr: false }),
  pricing: dynamic(() => import("@/components/landing/PricingSection"), { ssr: false }),
  faq: dynamic(() => import("@/components/landing/FAQSection"), { ssr: false }),
  cta: dynamic(() => import("@/components/landing/CTAFooter"), { ssr: false }),
  grade_showcase: dynamic(() => import("@/components/landing/GradeShowcase"), { ssr: false }),
  subjects_grid: dynamic(() => import("@/components/landing/SubjectsGrid"), { ssr: false }),
  partners: dynamic(() => import("@/components/landing/PartnersBar"), { ssr: false }),
  company_hero: dynamic(() => import("@/components/landing/PlatformHero"), { ssr: false }),
  company_stats: dynamic(() => import("@/components/landing/PlatformStats"), { ssr: false }),
  services_showcase: dynamic(() => import("@/components/landing/ServicesShowcase"), { ssr: false }),
  portfolio: dynamic(() => import("@/components/landing/PortfolioShowcase"), { ssr: false }),
  company_how_it_works: dynamic(() => import("@/components/landing/PlatformHowItWorks"), { ssr: false }),
};

export default function WidgetRenderer({ widgets }: { widgets: WidgetData[] }) {
  const sorted = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <>
      {sorted.map((widget) => {
        const Component = WIDGET_COMPONENTS[widget.widget_type];
        if (!Component) return null;
        return <Component key={widget.id} config={widget.config} />;
      })}
    </>
  );
}
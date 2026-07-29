"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { localizedContent } from "@/lib/i18n";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) { setCount(target); clearInterval(timer); }
            else { setCount(Math.floor(current)); }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{count.toLocaleString()}{suffix}</div>;
}

export default function StatsBar({ content }: { content?: Record<string, any> }) {
  const t = useTranslations("landing");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const c = content || {};

  const defaultStats = [
    { key: "teachers", target: 10000, suffix: "+", icon: "👨‍🏫", label: t("statteachers") },
    { key: "plans", target: 50000, suffix: "+", icon: "📝", label: t("statplans") },
    { key: "languages", target: 9, suffix: "", icon: "🌍", label: t("statlanguages") },
    { key: "rating", target: 48, suffix: "/5", icon: "⭐", label: t("statrating") },
  ];

  const stats = c.items?.length ? c.items.map((item: any) => ({
    target: parseInt(item.value) || 0,
    suffix: item.value?.replace(/[0-9]/g, "") || "",
    icon: "📊",
    label: localizedContent(item, "label", locale) || "",
  })) : [
    { target: parseInt(c.stat1_value) || 10000, suffix: (c.stat1_value || "10000+").replace(/[0-9]/g, ""), icon: "👨‍🏫", label: c.stat1_label || t("statteachers") },
    { target: parseInt(c.stat2_value) || 50000, suffix: (c.stat2_value || "50000+").replace(/[0-9]/g, ""), icon: "📝", label: c.stat2_label || t("statplans") },
    { target: parseInt(c.stat3_value) || 9, suffix: (c.stat3_value || "9").replace(/[0-9]/g, ""), icon: "🌍", label: c.stat3_label || t("statlanguages") },
    { target: parseInt(c.stat4_value) || 48, suffix: (c.stat4_value || "48/5").replace(/[0-9]/g, ""), icon: "⭐", label: c.stat4_label || t("statrating") },
  ];

  return (
    <section id="stats" className="py-16" style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {stats.map((stat: any, i: number) => (
            <div key={i} className={`text-center animate-fade-in-up delay-${(i + 1) * 100}`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

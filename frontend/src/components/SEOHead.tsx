"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface SEOData {
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export default function SEOHead({ seo }: { seo?: SEOData }) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  useEffect(() => {
    if (seo?.meta_title) {
      document.title = seo.meta_title;
    }

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (name.startsWith("og:")) {
          el.setAttribute("property", name);
        } else {
          el.setAttribute("name", name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (seo?.meta_description) setMeta("description", seo.meta_description);
    if (seo?.og_title) setMeta("og:title", seo.og_title);
    if (seo?.og_description) setMeta("og:description", seo.og_description);
    if (seo?.og_image) setMeta("og:image", seo.og_image);
    setMeta("og:locale", locale === "ar" ? "ar_SA" : "en_US");
  }, [seo, locale]);

  return null;
}

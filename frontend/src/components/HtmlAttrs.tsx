"use client";

import { useEffect } from "react";
import { localeRtl } from "@/i18n/config";

export default function HtmlAttrs({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeRtl[locale] ? "rtl" : "ltr";
  }, [locale]);

  return null;
}

"use client";

import { useEffect } from "react";

export default function HtmlAttrs({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = ["ar", "ur"].includes(locale) ? "rtl" : "ltr";
  }, [locale]);

  return null;
}

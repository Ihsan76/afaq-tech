"use client";

import { useState, useEffect, useCallback } from "react";
import { THEMES, type Theme } from "@/types/theme";

const STORAGE_KEY = "afaq-theme";

function getStoredTheme(): string {
  if (typeof window === "undefined") return "classic";
  return localStorage.getItem(STORAGE_KEY) || "classic";
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-transitioning");
  root.setAttribute("data-theme", theme.id);

  const c = theme.colors;
  root.style.setProperty("--color-primary", c.primary);
  root.style.setProperty("--color-primary-hover", adjustBrightness(c.primary, -10));
  root.style.setProperty("--color-primary-light", hexToRgba(c.primary, 0.08));
  root.style.setProperty("--color-secondary", c.secondary);
  root.style.setProperty("--color-secondary-hover", adjustBrightness(c.secondary, -10));
  root.style.setProperty("--color-accent", c.accent);
  root.style.setProperty("--color-success", c.success);
  root.style.setProperty("--color-success-light", hexToRgba(c.success, 0.1));
  root.style.setProperty("--color-error", c.error);
  root.style.setProperty("--color-error-light", hexToRgba(c.error, 0.1));
  root.style.setProperty("--color-warning", c.warning);
  root.style.setProperty("--color-warning-light", hexToRgba(c.warning, 0.1));
  root.style.setProperty("--color-background", c.background);
  root.style.setProperty("--color-surface", c.surface);
  root.style.setProperty("--color-surface-alt", c.surfaceAlt);
  root.style.setProperty("--color-text", c.text);
  root.style.setProperty("--color-text-secondary", c.textSecondary);
  root.style.setProperty("--color-text-muted", c.textMuted);
  root.style.setProperty("--color-border", c.border);
  root.style.setProperty("--color-border-light", c.borderLight);
  root.style.setProperty("--color-muted", c.muted);

  const b = theme.buttons;
  root.style.setProperty("--btn-radius", getRadius(b.shape));
  root.style.setProperty("--btn-padding", getPadding(b.size));
  root.style.setProperty("--btn-font-weight", getFontWeight(b.shadow === "none" ? "normal" : "medium"));
  root.style.setProperty("--btn-shadow", getShadow(b.shadow));
  root.style.setProperty("--btn-hover-transform", b.hoverEffect === "scale" ? "scale(1.02)" : b.hoverEffect === "glow" ? "scale(1.03)" : "none");

  const card = theme.cards;
  root.style.setProperty("--card-radius", getRadius(card.borderRadius));
  root.style.setProperty("--card-shadow", getShadow(card.shadow));
  root.style.setProperty("--card-glass", card.glass ? "1" : "0");

  const f = theme.fonts;
  root.style.setProperty("--font-heading", f.heading);
  root.style.setProperty("--font-body", f.body);
  root.style.setProperty("--font-size-base", f.baseSize);
  root.style.setProperty("--line-height", f.lineHeight);

  requestAnimationFrame(() => {
    setTimeout(() => root.classList.remove("theme-transitioning"), 400);
  });
}

export function useTheme() {
  const [themeId, setThemeIdState] = useState<string>("classic");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    const theme = THEMES.find((t) => t.id === stored) || THEMES[0];
    setThemeIdState(theme.id);
    applyThemeToDOM(theme);
    setIsLoaded(true);
  }, []);

  const setThemeId = useCallback((id: string) => {
    const theme = THEMES.find((t) => t.id === id);
    if (!theme) return;
    setThemeIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
    applyThemeToDOM(theme);
  }, []);

  const resetTheme = useCallback(() => {
    setThemeId("classic");
  }, [setThemeId]);

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  return {
    themeId,
    setThemeId,
    resetTheme,
    currentTheme,
    themes: THEMES,
    isLoaded,
  };
}

/* ── Helpers ── */

function getRadius(shape: string): string {
  return { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem", full: "9999px" }[shape] || "0.75rem";
}

function getPadding(size: string): string {
  return { sm: "0.375rem 0.75rem", md: "0.625rem 1.25rem", lg: "0.75rem 1.5rem" }[size] || "0.625rem 1.25rem";
}

function getFontWeight(w: string): string {
  return { normal: "400", medium: "500", bold: "700" }[w] || "600";
}

function getShadow(s: string): string {
  return {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  }[s] || "none";
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

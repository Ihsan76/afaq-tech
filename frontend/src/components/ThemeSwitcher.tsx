"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/hooks/useTheme";
import type { Theme } from "@/types/theme";

export default function ThemeSwitcher() {
  const t = useTranslations();
  const { themeId, setThemeId, themes } = useTheme();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isActive={theme.id === themeId}
          onSelect={() => setThemeId(theme.id)}
          t={t}
        />
      ))}
    </div>
  );
}

function ThemeCard({
  theme,
  isActive,
  onSelect,
  t,
}: {
  theme: Theme;
  isActive: boolean;
  onSelect: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const dir = typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr";
  const label = dir === "rtl" ? theme.name_ar : theme.name;
  const desc = dir === "rtl" ? theme.description_ar : theme.description;

  return (
    <button
      onClick={onSelect}
      className="group relative text-start p-4 rounded-2xl border-2 transition-all duration-300"
      style={{
        borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: isActive ? "var(--color-primary-light)" : "var(--color-surface)",
        boxShadow: isActive ? "0 4px 15px var(--color-primary)" : "none",
        transform: isActive ? "scale(1.02)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = "var(--color-primary)";
          e.currentTarget.style.boxShadow = "0 4px 10px var(--color-primary)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-3 ltr:right-3 rtl:left-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-primary)" }}>
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Theme icon */}
      <div className="text-2xl mb-2">{theme.icon}</div>

      {/* Theme name */}
      <h3 className="text-sm font-bold mb-1" style={{ color: isActive ? "var(--color-primary)" : "var(--color-text)" }}>
        {label}
      </h3>

      {/* Description */}
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{desc}</p>

      {/* Color preview dots */}
      <div className="flex gap-1.5 mt-3">
        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.primary }} />
        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.secondary }} />
        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.accent }} />
        <span className="w-3 h-3 rounded-full border border-black/5" style={{ backgroundColor: theme.colors.background }} />
      </div>
    </button>
  );
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bannerFrom: string;
  bannerTo: string;
  success: string;
  error: string;
  warning: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  muted: string;
}

export interface ThemeButtons {
  shape: "rounded" | "pill" | "square";
  size: "sm" | "md" | "lg";
  shadow: "none" | "sm" | "md" | "lg";
  hoverEffect: "none" | "scale" | "shadow" | "glow";
}

export interface ThemeCards {
  borderRadius: "none" | "sm" | "md" | "lg" | "full";
  border: "none" | "thin" | "medium" | "thick";
  shadow: "none" | "sm" | "md" | "lg";
  glass: boolean;
}

export interface ThemeFonts {
  heading: string;
  body: string;
  baseSize: string;
  lineHeight: string;
}

export interface Theme {
  id: string;
  name: string;
  name_ar: string;
  icon: string;
  description: string;
  description_ar: string;
  is_active: boolean;
  is_default: boolean;
  colors: ThemeColors;
  buttons: ThemeButtons;
  cards: ThemeCards;
  fonts: ThemeFonts;
}

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Afaq Classic",
    name_ar: "آفاق كلاسيكي",
    icon: "🎨",
    description: "Clean blue-indigo gradient, professional and modern",
    description_ar: "تدرج أزرق-نيلي أنيق وعصري",
    is_active: true,
    is_default: true,
    colors: {
      primary: "#4F46E5",
      secondary: "#7C3AED",
      accent: "#6366F1",
      bannerFrom: "#4F46E5",
      bannerTo: "#7C3AED",
      success: "#059669",
      error: "#EF4444",
      warning: "#D97706",
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surfaceAlt: "#F1F5F9",
      text: "#0F172A",
      textSecondary: "#475569",
      textMuted: "#94A3B8",
      border: "#E2E8F0",
      borderLight: "#F1F5F9",
      muted: "#F1F5F9",
    },
    buttons: { shape: "rounded", size: "md", shadow: "md", hoverEffect: "scale" },
    cards: { borderRadius: "lg", border: "thin", shadow: "md", glass: true },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
  {
    id: "dark",
    name: "Afaq Night",
    name_ar: "آفاق مسائي",
    icon: "🌙",
    description: "Deep purple-indigo dark theme, easy on the eyes",
    description_ar: "ثيم داكن بنفسجي-نيلي مريح للعينين",
    is_active: true,
    is_default: false,
    colors: {
      primary: "#6366F1",
      secondary: "#8B5CF6",
      accent: "#A78BFA",
      bannerFrom: "#312E81",
      bannerTo: "#5B21B6",
      success: "#059669",
      error: "#F87171",
      warning: "#D97706",
      background: "#0B0A14",
      surface: "#14131F",
      surfaceAlt: "#1D1B2B",
      text: "#EDEBF4",
      textSecondary: "#A6A1B8",
      textMuted: "#6F6A83",
      border: "#2A2737",
      borderLight: "#211F30",
      muted: "#14131F",
    },
    buttons: { shape: "rounded", size: "md", shadow: "lg", hoverEffect: "glow" },
    cards: { borderRadius: "lg", border: "thin", shadow: "lg", glass: true },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
  {
    id: "light",
    name: "Afaq Light",
    name_ar: "آفاق فاتح",
    icon: "☀️",
    description: "Warm emerald-green light theme, fresh and vibrant",
    description_ar: "ثيم فاتح بلون الزمرد الدافئ، منعش وحيوي",
    is_active: true,
    is_default: false,
    colors: {
      primary: "#059669",
      secondary: "#0D9488",
      accent: "#14B8A6",
      bannerFrom: "#059669",
      bannerTo: "#0D9488",
      success: "#059669",
      error: "#DC2626",
      warning: "#D97706",
      background: "#F5FAF7",
      surface: "#FFFFFF",
      surfaceAlt: "#E9F5EE",
      text: "#123F35",
      textSecondary: "#1B5E4F",
      textMuted: "#5E8B7A",
      border: "#D6E8DE",
      borderLight: "#E9F5EE",
      muted: "#E9F5EE",
    },
    buttons: { shape: "pill", size: "md", shadow: "sm", hoverEffect: "shadow" },
    cards: { borderRadius: "lg", border: "thin", shadow: "sm", glass: false },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
  {
    id: "neutral",
    name: "Afaq Neutral",
    name_ar: "آفاق محايد",
    icon: "⚪",
    description: "Minimal gray theme, clean and distraction-free",
    description_ar: "ثيم رمادي بسيط، نظيف وبدون تشتيت",
    is_active: true,
    is_default: false,
    colors: {
      primary: "#1F2937",
      secondary: "#4B5563",
      accent: "#6B7280",
      bannerFrom: "#1F2937",
      bannerTo: "#4B5563",
      success: "#059669",
      error: "#DC2626",
      warning: "#D97706",
      background: "#FAFAFB",
      surface: "#FFFFFF",
      surfaceAlt: "#F3F4F6",
      text: "#111827",
      textSecondary: "#4B5563",
      textMuted: "#9CA3AF",
      border: "#E5E7EB",
      borderLight: "#F3F4F6",
      muted: "#F3F4F6",
    },
    buttons: { shape: "rounded", size: "md", shadow: "sm", hoverEffect: "scale" },
    cards: { borderRadius: "md", border: "thin", shadow: "sm", glass: false },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
  {
    id: "colorful",
    name: "Afaq School",
    name_ar: "آفاق مدرسي",
    icon: "🌈",
    description: "Vibrant multi-color theme, fun and engaging for students",
    description_ar: "ثيم ملون ممتع وجذاب للطلاب",
    is_active: true,
    is_default: false,
    colors: {
      primary: "#DB2777",
      secondary: "#7C3AED",
      accent: "#D97706",
      bannerFrom: "#DB2777",
      bannerTo: "#7C3AED",
      success: "#059669",
      error: "#EF4444",
      warning: "#D97706",
      background: "#FFF9F2",
      surface: "#FFFFFF",
      surfaceAlt: "#FDEEF5",
      text: "#1C1917",
      textSecondary: "#57534E",
      textMuted: "#A29B94",
      border: "#E7E5E4",
      borderLight: "#F5F5F4",
      muted: "#FFF9F2",
    },
    buttons: { shape: "pill", size: "lg", shadow: "md", hoverEffect: "glow" },
    cards: { borderRadius: "full", border: "thin", shadow: "md", glass: true },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "17px", lineHeight: "1.7" },
  },
  {
    id: "ocean",
    name: "Afaq Ocean",
    name_ar: "آفاق محيطي",
    icon: "🌊",
    description: "Calm teal-cyan theme, soothing and focused",
    description_ar: "ثيم هادئ بلون الأزرق السماوي، مريح ومركّز",
    is_active: true,
    is_default: false,
    colors: {
      primary: "#0D9488",
      secondary: "#0891B2",
      accent: "#06B6D4",
      bannerFrom: "#0D9488",
      bannerTo: "#0891B2",
      success: "#059669",
      error: "#EF4444",
      warning: "#D97706",
      background: "#F2FAFC",
      surface: "#FFFFFF",
      surfaceAlt: "#E3F4F8",
      text: "#134E4A",
      textSecondary: "#0E7490",
      textMuted: "#5F9FAE",
      border: "#CFE7EC",
      borderLight: "#E3F4F8",
      muted: "#E3F4F8",
    },
    buttons: { shape: "rounded", size: "md", shadow: "md", hoverEffect: "scale" },
    cards: { borderRadius: "lg", border: "thin", shadow: "md", glass: true },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
];

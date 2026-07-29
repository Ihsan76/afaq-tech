export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
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
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
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
      primary: "#818CF8",
      secondary: "#A78BFA",
      accent: "#C084FC",
      success: "#34D399",
      error: "#F87171",
      warning: "#FBBF24",
      background: "#0F0D1A",
      surface: "#1A1726",
      surfaceAlt: "#231F33",
      text: "#F1F0F5",
      textSecondary: "#A09BB0",
      textMuted: "#6B6580",
      border: "#2D2842",
      borderLight: "#231F33",
      muted: "#1A1726",
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
      secondary: "#10B981",
      accent: "#34D399",
      success: "#22C55E",
      error: "#DC2626",
      warning: "#D97706",
      background: "#FAFDF9",
      surface: "#FFFFFF",
      surfaceAlt: "#F0FDF4",
      text: "#14532D",
      textSecondary: "#166534",
      textMuted: "#86EFAC",
      border: "#BBF7D0",
      borderLight: "#DCFCE7",
      muted: "#F0FDF4",
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
      primary: "#374151",
      secondary: "#6B7280",
      accent: "#9CA3AF",
      success: "#059669",
      error: "#DC2626",
      warning: "#D97706",
      background: "#F9FAFB",
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
      primary: "#EC4899",
      secondary: "#8B5CF6",
      accent: "#F59E0B",
      success: "#10B981",
      error: "#EF4444",
      warning: "#F97316",
      background: "#FFF7ED",
      surface: "#FFFFFF",
      surfaceAlt: "#FFFBEB",
      text: "#1C1917",
      textSecondary: "#57534E",
      textMuted: "#A8A29E",
      border: "#E7E5E4",
      borderLight: "#F5F5F4",
      muted: "#FFF7ED",
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
      primary: "#0891B2",
      secondary: "#06B6D4",
      accent: "#22D3EE",
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      background: "#ECFEFF",
      surface: "#FFFFFF",
      surfaceAlt: "#CFFAFE",
      text: "#164E63",
      textSecondary: "#0E7490",
      textMuted: "#67E8F9",
      border: "#A5F3FC",
      borderLight: "#CFFAFE",
      muted: "#ECFEFF",
    },
    buttons: { shape: "rounded", size: "md", shadow: "md", hoverEffect: "scale" },
    cards: { borderRadius: "lg", border: "thin", shadow: "md", glass: true },
    fonts: { heading: "'IBM Plex Sans Arabic', sans-serif", body: "'Noto Sans Arabic', sans-serif", baseSize: "16px", lineHeight: "1.6" },
  },
];

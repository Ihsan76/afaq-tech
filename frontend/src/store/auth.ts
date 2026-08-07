import { create } from "zustand";
import { api } from "@/lib/api";
import { extractApiError } from "@/lib/apiErrors";

interface User {
  id: number;
  email: string;
  name_ar: string;
  name_en: string;
  name?: string;
  role: string;
  is_staff: boolean;
  subscription_plan: string;
  ui_language: string;
  input_language: string;
  output_language: string;
  timezone: string;
  preferred_currency: string;
  is_verified: boolean;
  phone: string;
  avatar: string;
  date_joined: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name_ar: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  sendVerification: (email: string, locale: string) => Promise<void>;
  confirmVerification: (email: string, code: string) => Promise<void>;
  completeGoogleLogin: (access: string, refresh: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== "undefined" ? localStorage.getItem("accessToken") : null,
  refreshToken: typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/login/", { email, password });
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      set({ user: data.user, accessToken: data.access, refreshToken: data.refresh, isLoading: false });
    } catch (err: any) {
      set({ error: extractApiError(err) || "حدث خطأ", isLoading: false });
      throw err;
    }
  },

  register: async (email: string, name_ar: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/auth/register/", { email, name_ar, password });
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      set({ user: data.user, accessToken: data.access, refreshToken: data.refresh, isLoading: false });
    } catch (err: any) {
      set({ error: extractApiError(err) || "حدث خطأ", isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const refresh = localStorage.getItem("refreshToken");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // ignore — always clear local session
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, accessToken: null, refreshToken: null });
  },

  sendVerification: async (email: string, locale: string) => {
    await api.post("/auth/verify-email/", { email, locale });
  },

  confirmVerification: async (email: string, code: string) => {
    const { data } = await api.post("/auth/verify-email/confirm/", { email, code });
    set({ user: data.user });
  },

  completeGoogleLogin: async (access: string, refresh: string) => {
    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);
    const { data } = await api.get("/auth/profile/");
    set({ user: data, accessToken: access, refreshToken: refresh, isLoading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    set({ isLoading: true });
    try {
      const { data } = await api.get("/auth/profile/");
      set({ user: data, accessToken: token, isLoading: false });
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
    }
  },
}));

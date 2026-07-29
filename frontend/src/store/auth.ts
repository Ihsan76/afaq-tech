import { create } from "zustand";
import { api } from "@/lib/api";

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
  logout: () => void;
  loadUser: () => Promise<void>;
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
      set({ error: err.response?.data?.error || "حدث خطأ", isLoading: false });
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
      const errorData = err.response?.data;
      let msg = "حدث خطأ";
      if (errorData) {
        msg = Object.values(errorData).flat().join(", ");
      }
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, accessToken: null, refreshToken: null });
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

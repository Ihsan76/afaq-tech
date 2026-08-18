import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: string;
  is_verified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    await SecureStore.setItemAsync('access_token', res.data.access);
    await SecureStore.setItemAsync('refresh_token', res.data.refresh);
    set({ user: res.data.user });
  },

  logout: async () => {
    const refresh = await SecureStore.getItemAsync('refresh_token');
    if (refresh) {
      try { await api.post('/auth/logout/', { refresh }); } catch {}
    }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) { set({ isLoading: false }); return; }
      const res = await api.get('/auth/me/');
      set({ user: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));

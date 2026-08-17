import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { duration: 4000, ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    if (newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, newToast.duration);
    }
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  success: (message, title) => {
    return get().addToast({ type: "success", message, title });
  },
  error: (message, title) => {
    return get().addToast({ type: "error", message, title });
  },
  warning: (message, title) => {
    return get().addToast({ type: "warning", message, title });
  },
  info: (message, title) => {
    return get().addToast({ type: "info", message, title });
  },
}));

export const useToast = useToastStore;

export const toast = {
  success: (message: string, title?: string) => useToastStore.getState().success(message, title),
  error: (message: string, title?: string) => useToastStore.getState().error(message, title),
  warning: (message: string, title?: string) => useToastStore.getState().warning(message, title),
  info: (message: string, title?: string) => useToastStore.getState().info(message, title),
  custom: (toast: Omit<ToastMessage, "id">) => useToastStore.getState().addToast(toast),
};

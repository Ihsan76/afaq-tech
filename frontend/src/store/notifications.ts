import { create } from "zustand";
import { api } from "@/lib/api";

export interface NotificationItem {
  id: number;
  type: string;
  icon: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsState {
  unreadCount: number;
  pushEnabled: boolean;
  pushAvailable: boolean;
  pushSupported: boolean;
  loading: boolean;
  fetchUnread: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadPushState: () => Promise<void>;
  setupPush: () => Promise<boolean>;
  disablePush: () => Promise<void>;
}

const urlBase64ToUint8Array = (base64: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Url = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64Url);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  pushEnabled: false,
  pushAvailable: false,
  pushSupported:
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window,
  loading: false,

  fetchUnread: async () => {
    try {
      const { data } = await api.get("/notifications/unread-count/");
      set({ unreadCount: data.count });
    } catch {
      // silent — unauthenticated or backend down
    }
  },

  markRead: async (id: number) => {
    try {
      await api.post("/notifications/mark-read/", { notification_id: id });
      set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) }));
    } catch {
      // silent
    }
  },

  markAllRead: async () => {
    try {
      const { data } = await api.post("/notifications/mark-read/", { all: true });
      set({ unreadCount: 0 });
      return data;
    } catch {
      // silent
    }
  },

  loadPushState: async () => {
    if (!get().pushSupported) {
      set({ pushAvailable: false });
      return;
    }
    try {
      const [subRes, keyRes] = await Promise.all([
        api.get("/notifications/push/subscription/"),
        api.get("/notifications/push/public-key/"),
      ]);
      set({ pushEnabled: !!subRes.data.enabled, pushAvailable: true });
      void keyRes;
    } catch {
      set({ pushAvailable: false });
    }
  },

  setupPush: async () => {
    if (!get().pushSupported || !("Notification" in window)) return false;
    try {
      let publicKey: string;
      try {
        const { data } = await api.get("/notifications/push/public-key/");
        publicKey = data.public_key;
      } catch {
        set({ pushAvailable: false });
        return false;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      if (!reg.pushManager) return false;

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const sub = subscription.toJSON();
      await api.post("/notifications/push/subscription/", {
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh,
        auth: sub.keys?.auth,
      });
      set({ pushEnabled: true, pushAvailable: true });
      return true;
    } catch {
      return false;
    }
  },

  disablePush: async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await reg?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      await api.delete("/notifications/push/subscription/");
    } catch {
      // silent
    }
    set({ pushEnabled: false });
  },
}));

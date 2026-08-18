import { create } from "zustand";
import { api } from "@/lib/api";

interface Participant {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface LastMessage {
  id: number;
  content: string;
  sender_name: string;
  created_at: string;
}

interface LiveConversation {
  id: number;
  participants: number[];
  participants_detail: Participant[];
  school: number | null;
  last_message: LastMessage | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface LiveMessage {
  id: number;
  sender: number;
  sender_name: string;
  sender_email: string;
  content: string;
  created_at: string;
}

interface LiveChatState {
  conversations: LiveConversation[];
  activeConversation: number | null;
  messages: LiveMessage[];
  ws: WebSocket | null;
  typing: Record<number, string>;
  loading: boolean;

  fetchConversations: () => Promise<void>;
  setActiveConversation: (id: number | null) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (content: string) => void;
  connectWebSocket: (conversationId: number) => void;
  disconnectWebSocket: () => void;
  startConversation: (participantIds: number[], schoolId?: number) => Promise<LiveConversation>;
}

export const useLiveChatStore = create<LiveChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  ws: null,
  typing: {},
  loading: false,

  fetchConversations: async () => {
    try {
      const res = await api.get("/chat/conversations/");
      set({ conversations: res.data.results || res.data });
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversation: id });
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages/`);
      set({ messages: res.data.results || res.data, loading: false });
    } catch (e) {
      console.error("Failed to fetch messages", e);
      set({ loading: false });
    }
  },

  sendMessage: (content) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", content }));
    }
  },

  connectWebSocket: (conversationId) => {
    const { ws: oldWs } = get();
    if (oldWs) oldWs.close();

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/chat/${conversationId}/`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        set((state) => ({
          messages: [...state.messages, data.message],
        }));
      } else if (data.type === "typing") {
        set((state) => ({
          typing: data.is_typing
            ? { ...state.typing, [data.user_id]: data.user_name }
            : Object.fromEntries(Object.entries(state.typing).filter(([k]) => k !== String(data.user_id))),
        }));
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        const { activeConversation } = get();
        if (activeConversation === conversationId) {
          get().connectWebSocket(conversationId);
        }
      }, 3000);
    };

    set({ ws });
  },

  disconnectWebSocket: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ ws: null });
  },

  startConversation: async (participantIds, schoolId) => {
    const res = await api.post("/chat/conversations/start_conversation/", {
      participant_ids: participantIds,
      school_id: schoolId,
    });
    const conv = res.data;
    await get().fetchConversations();
    return conv;
  },
}));

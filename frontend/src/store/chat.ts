import { create } from "zustand";
import { api } from "@/lib/api";
import { useAuthStore } from "./auth";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  message_count: number;
  last_message: { role: string; content: string } | null;
  created_at: string;
  updated_at: string;
}

interface AIModel {
  id: number;
  provider: string;
  model_id: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  is_default: boolean;
  max_tokens: number;
}

interface ChatState {
  conversations: Conversation[];
  activeId: number | null;
  messages: Record<number, Message[]>;
  streamingContent: string;
  isStreaming: boolean;
  isOpen: boolean;
  error: string | null;
  models: AIModel[];
  selectedModel: string;

  loadConversations: () => Promise<void>;
  loadMessages: (id: number) => Promise<void>;
  sendMessage: (text: string, modelId?: string) => Promise<void>;
  createConversation: () => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  clearConversation: (id: number) => Promise<void>;
  setActive: (id: number | null) => void;
  toggleOpen: () => void;
  setOpen: (v: boolean) => void;
  loadModels: () => Promise<void>;
  setSelectedModel: (modelId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: {},
  streamingContent: "",
  isStreaming: false,
  isOpen: false,
  error: null,
  models: [],
  selectedModel: "",

  loadConversations: async () => {
    try {
      const { data } = await api.get("/ai/conversations/");
      const list = data?.results ?? data ?? [];
      set({ conversations: list });
    } catch {
      // silently fail
    }
  },

  loadMessages: async (id: number) => {
    try {
      const { data } = await api.get(`/ai/conversations/${id}/`);
      set((s) => ({
        messages: { ...s.messages, [id]: data.messages ?? [] },
        activeId: id,
      }));
    } catch {
      // silently fail
    }
  },

  sendMessage: async (text: string, modelId?: string) => {
    const { activeId, messages, selectedModel } = get();
    const token = useAuthStore.getState().accessToken ||
      (typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null);

    const tempUserMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      tokens: 0,
      created_at: new Date().toISOString(),
    };

    set((s) => {
      const convId = s.activeId || 0;
      const existing = s.messages[convId] || [];
      return {
        messages: { ...s.messages, [convId]: [...existing, tempUserMsg] },
        streamingContent: "",
        isStreaming: true,
        error: null,
      };
    });

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1";
      const response = await fetch(`${baseUrl}/ai/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversation_id: activeId,
          model_id: modelId || selectedModel || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let newConvId = activeId;
      let fullContent = "";
      const isNewConversation = !activeId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "start") {
              newConvId = ev.conversation_id;
              if (isNewConversation) {
                set({ activeId: newConvId });
                await get().loadConversations();
              }
            } else if (ev.type === "chunk") {
              fullContent += ev.content;
              set({ streamingContent: fullContent });
            } else if (ev.type === "done") {
              newConvId = ev.conversation_id;
              const assistantMsg: Message = {
                id: ev.message_id || Date.now() + 1,
                role: "assistant",
                content: fullContent,
                tokens: 0,
                created_at: new Date().toISOString(),
              };
              set((s) => {
                const convId = newConvId || s.activeId || 0;
                const existing = s.messages[convId] || [];
                const updated = [...existing, assistantMsg];
                return {
                  messages: { ...s.messages, [convId]: updated },
                  streamingContent: "",
                  isStreaming: false,
                  activeId: convId,
                };
              });
              await get().loadConversations();
              fullContent = "";
            }
          } catch {
            // skip parse errors
          }
        }
      }
    } catch (err: any) {
      set({
        isStreaming: false,
        error: err.message || "حدث خطأ في الاتصال",
      });
    }
  },

  createConversation: async () => {
    try {
      const { data } = await api.post("/ai/conversations/create/", { title: "" });
      set((s) => ({
        conversations: [data, ...s.conversations],
        activeId: data.id,
        messages: { ...s.messages, [data.id]: [] },
      }));
    } catch {
      // silently fail
    }
  },

  deleteConversation: async (id: number) => {
    try {
      await api.delete(`/ai/conversations/${id}/delete/`);
      set((s) => {
        const { [id]: _, ...rest } = s.messages;
        return {
          conversations: s.conversations.filter((c) => c.id !== id),
          messages: rest,
          activeId: s.activeId === id ? null : s.activeId,
        };
      });
    } catch {
      // silently fail
    }
  },

  clearConversation: async (id: number) => {
    try {
      await api.delete(`/ai/conversations/${id}/clear/`);
      set((s) => ({
        messages: { ...s.messages, [id]: [] },
      }));
    } catch {
      // silently fail
    }
  },

  setActive: (id) => {
    set({ activeId: id, streamingContent: "", error: null });
    if (id) get().loadMessages(id);
  },

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (v) => set({ isOpen: v }),

  loadModels: async () => {
    try {
      const { data } = await api.get("/ai/models/");
      const list = Array.isArray(data) ? data : data?.results ?? [];
      set({ models: list });
      const stored = localStorage.getItem("preferredModel");
      if (stored && list.some((m: AIModel) => m.model_id === stored)) {
        set({ selectedModel: stored });
      } else {
        const def = list.find((m: AIModel) => m.is_default);
        if (def) set({ selectedModel: def.model_id });
      }
    } catch {
      // silently fail
    }
  },

  setSelectedModel: (modelId: string) => {
    localStorage.setItem("preferredModel", modelId);
    set({ selectedModel: modelId });
  },
}));

import { create } from "zustand";
import type { AIModelDto, CapabilityDto, ConversationDto, MessageDto } from "@qa-copilot/shared";
import { aiModelApi } from "../lib/ai-model/aiModelApi";
import { capabilityApi } from "../lib/capability/capabilityApi";
import { conversationApi } from "../lib/conversation/conversationApi";

type ConversationState = {
  conversations: ConversationDto[];
  activeConversation: ConversationDto | null;
  models: AIModelDto[];
  capabilities: CapabilityDto[];
  selectedModelId: string;
  selectedCapabilityId: string;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  loadInitialData: () => Promise<void>;
  startConversation: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  setSelectedModelId: (modelId: string) => void;
  setSelectedCapabilityId: (capabilityId: string) => void;
  sendMessage: (content: string) => Promise<ConversationDto | null>;
  appendAssistantMessage: (message: MessageDto) => void;
  setError: (message: string | null) => void;
};

function sortByUpdatedAtDesc(conversations: ConversationDto[]): ConversationDto[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  models: [],
  capabilities: [],
  selectedModelId: "",
  selectedCapabilityId: "",
  isLoading: false,
  isSending: false,
  error: null,

  async loadInitialData() {
    set({ isLoading: true, error: null });
    try {
      const [conversations, models, capabilities] = await Promise.all([
        conversationApi.list(),
        aiModelApi.list(),
        capabilityApi.list(),
      ]);
      set((state) => ({
        conversations: sortByUpdatedAtDesc(conversations),
        models,
        capabilities,
        selectedModelId: state.selectedModelId || (models[0]?.id ?? ""),
        selectedCapabilityId: state.selectedCapabilityId || (capabilities[0]?.id ?? ""),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  async startConversation() {
    set({ error: null });
    try {
      const started = await conversationApi.start();
      set((state) => ({
        activeConversation: started,
        conversations: sortByUpdatedAtDesc([started, ...state.conversations]),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  async selectConversation(conversationId) {
    set({ error: null });
    try {
      const conversation = await conversationApi.get(conversationId);
      set({ activeConversation: conversation });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  setSelectedModelId(modelId) {
    set({ selectedModelId: modelId });
  },

  setSelectedCapabilityId(capabilityId) {
    set({ selectedCapabilityId: capabilityId });
  },

  async sendMessage(content) {
    const { activeConversation } = get();
    if (!activeConversation) {
      return null;
    }

    set({ isSending: true, error: null });
    try {
      const updated = await conversationApi.sendMessage(activeConversation.id, content);
      set((state) => ({
        activeConversation: updated,
        conversations: sortByUpdatedAtDesc(
          state.conversations.map((item) => (item.id === updated.id ? updated : item)),
        ),
        isSending: false,
      }));
      return updated;
    } catch (err) {
      set({ error: (err as Error).message, isSending: false });
      return null;
    }
  },

  appendAssistantMessage(message) {
    set((state) => {
      if (!state.activeConversation) {
        return state;
      }

      const updatedConversation: ConversationDto = {
        ...state.activeConversation,
        messages: [...state.activeConversation.messages, message],
      };

      return {
        activeConversation: updatedConversation,
        conversations: sortByUpdatedAtDesc(
          state.conversations.map((item) =>
            item.id === updatedConversation.id ? updatedConversation : item,
          ),
        ),
      };
    });
  },

  setError(message) {
    set({ error: message });
  },
}));

import { create } from "zustand";
import { conversationApi } from "../lib/conversation/conversationApi";
import { useConversationStore } from "./conversation.store";

type StreamingState = {
  isGenerating: boolean;
  streamingText: string;
  error: string | null;
  generateReply: (conversationId: string, modelId: string) => Promise<void>;
  cancel: () => void;
};

let activeAbortController: AbortController | null = null;

export const useStreamingStore = create<StreamingState>((set) => ({
  isGenerating: false,
  streamingText: "",
  error: null,

  async generateReply(conversationId, modelId) {
    const controller = new AbortController();
    activeAbortController = controller;
    set({ isGenerating: true, streamingText: "", error: null });

    try {
      for await (const event of conversationApi.streamGenerateReply(
        conversationId,
        modelId,
        controller.signal,
      )) {
        if (event.type === "chunk") {
          set((state) => ({ streamingText: state.streamingText + event.delta }));
        } else if (event.type === "completed") {
          useConversationStore.getState().appendAssistantMessage(event.message);
        } else if (event.type === "error") {
          set({ error: event.message });
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        set({ error: (err as Error).message });
      }
    } finally {
      set({ isGenerating: false, streamingText: "" });
      activeAbortController = null;
    }
  },

  cancel() {
    activeAbortController?.abort();
  },
}));

useConversationStore.subscribe((state, previousState) => {
  if (state.activeConversation?.id === previousState.activeConversation?.id) {
    return;
  }

  activeAbortController?.abort();
  activeAbortController = null;
  useStreamingStore.setState({ isGenerating: false, streamingText: "", error: null });
});

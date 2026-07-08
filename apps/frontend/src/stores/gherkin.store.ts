import { create } from "zustand";
import type { GherkinResultDto } from "@qa-copilot/shared";
import { gherkinApi } from "../lib/gherkin/gherkinApi";
import { useConversationStore } from "./conversation.store";

type GherkinState = {
  result: GherkinResultDto | null;
  isGenerating: boolean;
  error: string | null;
  generate: (conversationId: string, modelId: string) => Promise<void>;
  clear: () => void;
};

export const useGherkinStore = create<GherkinState>((set) => ({
  result: null,
  isGenerating: false,
  error: null,

  async generate(conversationId, modelId) {
    set({ isGenerating: true, error: null });
    try {
      const result = await gherkinApi.generate(conversationId, modelId);
      set({ result, isGenerating: false });
    } catch (err) {
      set({ error: (err as Error).message, isGenerating: false });
    }
  },

  clear() {
    set({ result: null, error: null });
  },
}));

useConversationStore.subscribe((state, previousState) => {
  if (state.activeConversation?.id === previousState.activeConversation?.id) {
    return;
  }

  useGherkinStore.setState({ result: null, isGenerating: false, error: null });
});

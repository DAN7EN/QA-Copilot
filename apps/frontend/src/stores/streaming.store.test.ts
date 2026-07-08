import { beforeEach, describe, expect, it, vi } from "vitest";
import { conversationApi, type GenerationStreamEvent } from "../lib/conversation/conversationApi";
import { useConversationStore } from "./conversation.store";
import { useStreamingStore } from "./streaming.store";

vi.mock("../lib/conversation/conversationApi", () => ({
  conversationApi: {
    streamGenerateReply: vi.fn(),
  },
}));

async function* toAsyncGenerator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

describe("useStreamingStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStreamingStore.setState({ isGenerating: false, streamingText: "", error: null });
    useConversationStore.setState({
      activeConversation: {
        id: "conv-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        messages: [],
      },
    });
  });

  it("acumula los chunks y guarda el mensaje final en el store de conversación", async () => {
    const events: GenerationStreamEvent[] = [
      { type: "chunk", delta: "Hola" },
      { type: "chunk", delta: " mundo" },
      {
        type: "completed",
        message: {
          id: "msg-1",
          role: "assistant",
          content: "Hola mundo",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      },
    ];
    vi.mocked(conversationApi.streamGenerateReply).mockReturnValue(toAsyncGenerator(events));

    await useStreamingStore.getState().generateReply("conv-1", "model-1");

    expect(useStreamingStore.getState().isGenerating).toBe(false);
    expect(useStreamingStore.getState().streamingText).toBe("");
    expect(useConversationStore.getState().activeConversation?.messages).toEqual([
      {
        id: "msg-1",
        role: "assistant",
        content: "Hola mundo",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("guarda el error cuando el servidor emite un evento de error", async () => {
    const events: GenerationStreamEvent[] = [{ type: "error", code: "X", message: "Falló" }];
    vi.mocked(conversationApi.streamGenerateReply).mockReturnValue(toAsyncGenerator(events));

    await useStreamingStore.getState().generateReply("conv-1", "model-1");

    expect(useStreamingStore.getState().error).toBe("Falló");
  });

  it("limpia el error al cambiar de conversación activa", async () => {
    const events: GenerationStreamEvent[] = [{ type: "error", code: "X", message: "Falló" }];
    vi.mocked(conversationApi.streamGenerateReply).mockReturnValue(toAsyncGenerator(events));
    await useStreamingStore.getState().generateReply("conv-1", "model-1");
    expect(useStreamingStore.getState().error).toBe("Falló");

    useConversationStore.setState({
      activeConversation: {
        id: "conv-2",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        messages: [],
      },
    });

    expect(useStreamingStore.getState().error).toBeNull();
  });
});

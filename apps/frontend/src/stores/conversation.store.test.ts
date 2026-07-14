import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIModelDto, CapabilityDto, ConversationDto } from "@qa-copilot/shared";
import { aiModelApi } from "../lib/ai-model/aiModelApi";
import { capabilityApi } from "../lib/capability/capabilityApi";
import { conversationApi } from "../lib/conversation/conversationApi";
import { useConversationStore } from "./conversation.store";

vi.mock("../lib/ai-model/aiModelApi", () => ({
  aiModelApi: { list: vi.fn() },
}));
vi.mock("../lib/capability/capabilityApi", () => ({
  capabilityApi: { list: vi.fn() },
}));
vi.mock("../lib/conversation/conversationApi", () => ({
  conversationApi: {
    list: vi.fn(),
    start: vi.fn(),
    get: vi.fn(),
    sendMessage: vi.fn(),
    generateReply: vi.fn(),
    streamGenerateReply: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
  },
}));

function buildConversation(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: "conv-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    title: null,
    messages: [],
    ...overrides,
  };
}

describe("useConversationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConversationStore.setState({
      conversations: [],
      activeConversation: null,
      models: [],
      capabilities: [],
      selectedModelId: "",
      selectedCapabilityId: "",
      isLoading: false,
      isSending: false,
      error: null,
    });
  });

  it("carga conversaciones, modelos y capacidades ordenando por última actualización", async () => {
    const older = buildConversation({ id: "a", updatedAt: "2026-01-01T00:00:00.000Z" });
    const newer = buildConversation({ id: "b", updatedAt: "2026-02-01T00:00:00.000Z" });
    vi.mocked(conversationApi.list).mockResolvedValue([older, newer]);
    vi.mocked(aiModelApi.list).mockResolvedValue([
      { id: "model-1", displayName: "Model", provider: "p", capabilities: [] },
    ] satisfies AIModelDto[]);
    vi.mocked(capabilityApi.list).mockResolvedValue([
      { id: "chat", name: "Chat", description: "" },
    ] satisfies CapabilityDto[]);

    await useConversationStore.getState().loadInitialData();

    const state = useConversationStore.getState();
    expect(state.conversations.map((item) => item.id)).toEqual(["b", "a"]);
    expect(state.selectedModelId).toBe("model-1");
    expect(state.selectedCapabilityId).toBe("chat");
    expect(state.isLoading).toBe(false);
  });

  it("agrega el mensaje del asistente a la conversación activa", () => {
    useConversationStore.setState({ activeConversation: buildConversation({ id: "conv-1" }) });

    useConversationStore.getState().appendAssistantMessage({
      id: "msg-1",
      role: "assistant",
      content: "Hola",
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    expect(useConversationStore.getState().activeConversation?.messages).toHaveLength(1);
  });

  it("sendMessage no hace nada sin conversación activa", async () => {
    const result = await useConversationStore.getState().sendMessage("hola");

    expect(result).toBeNull();
    expect(conversationApi.sendMessage).not.toHaveBeenCalled();
  });

  it("renameConversation actualiza la conversación activa y la lista", async () => {
    const original = buildConversation({ id: "conv-1", title: null });
    const renamed = buildConversation({ id: "conv-1", title: "Nuevo título" });
    useConversationStore.setState({ activeConversation: original, conversations: [original] });
    vi.mocked(conversationApi.rename).mockResolvedValue(renamed);

    await useConversationStore.getState().renameConversation("conv-1", "Nuevo título");

    expect(conversationApi.rename).toHaveBeenCalledWith("conv-1", "Nuevo título");
    expect(useConversationStore.getState().activeConversation?.title).toBe("Nuevo título");
    expect(useConversationStore.getState().conversations[0]?.title).toBe("Nuevo título");
  });

  it("renameConversation guarda el error si la API falla", async () => {
    vi.mocked(conversationApi.rename).mockRejectedValue(new Error("falló"));

    await useConversationStore.getState().renameConversation("conv-1", "Nuevo título");

    expect(useConversationStore.getState().error).toBe("falló");
  });

  it("deleteConversation quita la conversación de la lista y limpia la activa si coincide", async () => {
    const conversation = buildConversation({ id: "conv-1" });
    useConversationStore.setState({
      activeConversation: conversation,
      conversations: [conversation],
    });
    vi.mocked(conversationApi.remove).mockResolvedValue(undefined);

    await useConversationStore.getState().deleteConversation("conv-1");

    expect(conversationApi.remove).toHaveBeenCalledWith("conv-1");
    expect(useConversationStore.getState().conversations).toHaveLength(0);
    expect(useConversationStore.getState().activeConversation).toBeNull();
  });

  it("deleteConversation no toca la conversación activa si elimina otra distinta", async () => {
    const active = buildConversation({ id: "conv-1" });
    const other = buildConversation({ id: "conv-2" });
    useConversationStore.setState({
      activeConversation: active,
      conversations: [active, other],
    });
    vi.mocked(conversationApi.remove).mockResolvedValue(undefined);

    await useConversationStore.getState().deleteConversation("conv-2");

    expect(useConversationStore.getState().activeConversation?.id).toBe("conv-1");
    expect(useConversationStore.getState().conversations.map((item) => item.id)).toEqual([
      "conv-1",
    ]);
  });
});

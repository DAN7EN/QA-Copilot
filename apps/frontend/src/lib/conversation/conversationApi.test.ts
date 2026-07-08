import { describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/httpClient";
import { postSse } from "../http/sseClient";
import { conversationApi } from "./conversationApi";

vi.mock("../http/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../http/sseClient", () => ({
  postSse: vi.fn(),
}));

async function* toAsyncGenerator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item;
  }
}

describe("conversationApi", () => {
  it("inicia una conversación con un POST a /conversations", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ id: "1" });

    await conversationApi.start();

    expect(httpClient.post).toHaveBeenCalledWith("/conversations");
  });

  it("envía un mensaje con un POST a /conversations/:id/messages", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ id: "1" });

    await conversationApi.sendMessage("conv-1", "hola");

    expect(httpClient.post).toHaveBeenCalledWith("/conversations/conv-1/messages", {
      content: "hola",
    });
  });

  it("lista las conversaciones con un GET a /conversations", async () => {
    vi.mocked(httpClient.get).mockResolvedValue([{ id: "1" }]);

    await conversationApi.list();

    expect(httpClient.get).toHaveBeenCalledWith("/conversations");
  });

  it("obtiene una conversación con un GET a /conversations/:id", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ id: "1" });

    await conversationApi.get("conv-1");

    expect(httpClient.get).toHaveBeenCalledWith("/conversations/conv-1");
  });

  it("genera una respuesta del asistente con un POST a /conversations/:id/generate", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ id: "1" });

    await conversationApi.generateReply("conv-1", "gemini-2.5-flash");

    expect(httpClient.post).toHaveBeenCalledWith("/conversations/conv-1/generate", {
      modelId: "gemini-2.5-flash",
    });
  });

  it("transmite y traduce eventos SSE de chunk, completed y error", async () => {
    vi.mocked(postSse).mockResolvedValue(
      toAsyncGenerator([
        { event: "chunk", data: '{"delta":"Hola"}' },
        {
          event: "completed",
          data: '{"id":"1","role":"assistant","content":"Hola","createdAt":"now"}',
        },
        { event: "error", data: '{"code":"AI_PROVIDER.TIMEOUT","message":"timeout"}' },
      ]),
    );

    const events = [];
    for await (const event of conversationApi.streamGenerateReply("conv-1", "gemini-2.5-flash")) {
      events.push(event);
    }

    expect(postSse).toHaveBeenCalledWith(
      "/conversations/conv-1/generate/stream",
      { modelId: "gemini-2.5-flash" },
      undefined,
    );
    expect(events).toEqual([
      { type: "chunk", delta: "Hola" },
      {
        type: "completed",
        message: { id: "1", role: "assistant", content: "Hola", createdAt: "now" },
      },
      { type: "error", code: "AI_PROVIDER.TIMEOUT", message: "timeout" },
    ]);
  });
});

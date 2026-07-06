import { describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/httpClient";
import { conversationApi } from "./conversationApi";

vi.mock("../http/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

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
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { gherkinApi } from "../lib/gherkin/gherkinApi";
import { useConversationStore } from "./conversation.store";
import { useGherkinStore } from "./gherkin.store";

vi.mock("../lib/gherkin/gherkinApi", () => ({
  gherkinApi: {
    generate: vi.fn(),
  },
}));

describe("useGherkinStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGherkinStore.setState({ result: null, isGenerating: false, error: null });
    useConversationStore.setState({
      activeConversation: {
        id: "conv-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        title: null,
        messages: [],
      },
    });
  });

  it("guarda el resultado estructurado devuelto por la API", async () => {
    vi.mocked(gherkinApi.generate).mockResolvedValue({
      title: "Login",
      feature: "",
      scenarios: [{ title: "OK", steps: ["Given algo"] }],
      rawMarkdown: "Feature: Login",
    });

    await useGherkinStore.getState().generate("conv-1", "gemini-2.5-flash");

    expect(useGherkinStore.getState().isGenerating).toBe(false);
    expect(useGherkinStore.getState().result?.title).toBe("Login");
  });

  it("guarda el error si la API falla", async () => {
    vi.mocked(gherkinApi.generate).mockRejectedValue(new Error("falló"));

    await useGherkinStore.getState().generate("conv-1", "gemini-2.5-flash");

    expect(useGherkinStore.getState().error).toBe("falló");
    expect(useGherkinStore.getState().isGenerating).toBe(false);
  });

  it("limpia el resultado al cambiar de conversación activa", async () => {
    vi.mocked(gherkinApi.generate).mockResolvedValue({
      title: "Login",
      feature: "",
      scenarios: [],
      rawMarkdown: "Feature: Login",
    });
    await useGherkinStore.getState().generate("conv-1", "gemini-2.5-flash");
    expect(useGherkinStore.getState().result).not.toBeNull();

    useConversationStore.setState({
      activeConversation: {
        id: "conv-2",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        title: null,
        messages: [],
      },
    });

    expect(useGherkinStore.getState().result).toBeNull();
  });
});

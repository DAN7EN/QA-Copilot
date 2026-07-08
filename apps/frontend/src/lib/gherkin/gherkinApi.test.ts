import { describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/httpClient";
import { gherkinApi } from "./gherkinApi";

vi.mock("../http/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("gherkinApi", () => {
  it("genera un resultado Gherkin con un POST a /conversations/:id/capabilities/gherkin", async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ title: "Login", scenarios: [] });

    await gherkinApi.generate("conv-1", "gemini-2.5-flash");

    expect(httpClient.post).toHaveBeenCalledWith("/conversations/conv-1/capabilities/gherkin", {
      modelId: "gemini-2.5-flash",
    });
  });
});

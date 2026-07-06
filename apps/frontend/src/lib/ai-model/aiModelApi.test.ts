import { describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/httpClient";
import { aiModelApi } from "./aiModelApi";

vi.mock("../http/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("aiModelApi", () => {
  it("lista los modelos disponibles con un GET a /models", async () => {
    vi.mocked(httpClient.get).mockResolvedValue([]);

    await aiModelApi.list();

    expect(httpClient.get).toHaveBeenCalledWith("/models");
  });
});

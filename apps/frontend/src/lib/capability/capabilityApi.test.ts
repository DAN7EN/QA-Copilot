import { describe, expect, it, vi } from "vitest";
import { httpClient } from "../http/httpClient";
import { capabilityApi } from "./capabilityApi";

vi.mock("../http/httpClient", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("capabilityApi", () => {
  it("lista las capacidades disponibles con un GET a /capabilities", async () => {
    vi.mocked(httpClient.get).mockResolvedValue([]);

    await capabilityApi.list();

    expect(httpClient.get).toHaveBeenCalledWith("/capabilities");
  });
});

import { describe, expect, it } from "vitest";
import { createListCapabilitiesUseCase } from "./list-capabilities.use-case.js";

describe("ListCapabilitiesUseCase", () => {
  it("devuelve las capacidades registradas", async () => {
    const useCase = createListCapabilitiesUseCase();

    const capabilities = await useCase.execute();

    expect(capabilities.map((capability) => capability.id)).toContain("chat");
  });
});

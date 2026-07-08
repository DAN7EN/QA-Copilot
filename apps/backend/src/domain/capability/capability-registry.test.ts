import { describe, expect, it } from "vitest";
import {
  findCapabilityById,
  getCapabilityOrThrow,
  listCapabilities,
} from "./capability-registry.js";
import { CapabilityNotFoundError } from "./errors/capability.errors.js";

describe("capability-registry", () => {
  it("expone las capacidades chat y gherkin", () => {
    const ids = listCapabilities().map((capability) => capability.id);

    expect(ids).toEqual(["chat", "gherkin"]);
  });

  it("encuentra una capacidad existente por id", () => {
    const capability = findCapabilityById("chat");

    expect(capability?.name).toBe("Chat");
  });

  it("encuentra la capacidad gherkin por id", () => {
    const capability = findCapabilityById("gherkin");

    expect(capability?.name).toBe("Gherkin Generator");
  });

  it("devuelve null si la capacidad no existe", () => {
    expect(findCapabilityById("playwright")).toBeNull();
  });

  it("lanza CapabilityNotFoundError si la capacidad no existe", () => {
    expect(() => getCapabilityOrThrow("playwright")).toThrow(CapabilityNotFoundError);
  });
});

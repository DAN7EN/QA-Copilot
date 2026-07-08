import { describe, expect, it } from "vitest";
import { findPromptDefinition, listPrompts } from "./prompt-registry.js";
import { PromptNotFoundError } from "./errors/prompt.errors.js";

describe("prompt-registry", () => {
  it("expone el prompt de sistema del chat", () => {
    const ids = listPrompts().map((prompt) => prompt.id);

    expect(ids).toContain("chat.system");
  });

  it("resuelve un prompt existente por id", () => {
    const prompt = findPromptDefinition("chat.system");

    expect(prompt.version).toBe("1.0.0");
    expect(prompt.template.length).toBeGreaterThan(0);
  });

  it("resuelve un prompt existente por id y versión", () => {
    const prompt = findPromptDefinition("chat.system", "1.0.0");

    expect(prompt.id).toBe("chat.system");
  });

  it("lanza PromptNotFoundError si el id no existe", () => {
    expect(() => findPromptDefinition("no-existe")).toThrow(PromptNotFoundError);
  });

  it("lanza PromptNotFoundError si la versión no existe", () => {
    expect(() => findPromptDefinition("chat.system", "9.9.9")).toThrow(PromptNotFoundError);
  });
});

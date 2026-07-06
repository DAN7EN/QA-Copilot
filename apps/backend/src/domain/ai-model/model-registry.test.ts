import { describe, expect, it } from "vitest";
import { findModelById, getModelOrThrow, listModels } from "./model-registry.js";
import { ModelNotFoundError } from "./errors/ai-model.errors.js";

describe("model-registry", () => {
  it("expone el catálogo inicial de modelos", () => {
    const ids = listModels().map((model) => model.getId().toString());

    expect(ids).toEqual(["gemini-2.5-flash", "mistral-small", "llama-3.3-70b", "deepseek-v3"]);
  });

  it("encuentra un modelo existente por id", () => {
    const model = findModelById("mistral-small");

    expect(model?.getDisplayName()).toBe("Mistral Small");
  });

  it("devuelve null si el modelo no existe", () => {
    expect(findModelById("no-existe")).toBeNull();
  });

  it("lanza ModelNotFoundError si el modelo no existe", () => {
    expect(() => getModelOrThrow("no-existe")).toThrow(ModelNotFoundError);
  });
});

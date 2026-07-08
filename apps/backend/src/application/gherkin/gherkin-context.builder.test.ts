import { describe, expect, it } from "vitest";
import { createGherkinCapabilityContextBuilder } from "./gherkin-context.builder.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ModelNotFoundError } from "../../domain/ai-model/errors/ai-model.errors.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";

function createFakePromptManager(): PromptManager {
  return { render: () => "system prompt" };
}

describe("GherkinCapabilityContextBuilder", () => {
  it("resuelve el modelo y arma los mensajes vía buildGherkinContext", () => {
    const builder = createGherkinCapabilityContextBuilder(createFakePromptManager());
    const conversation = Conversation.start();
    conversation.addMessage("user", "necesito escenarios de login");

    const context = builder.build({ conversation, modelId: "gemini-2.5-flash" });

    expect(context.modelId.toString()).toBe("gemini-2.5-flash");
    expect(context.messages).toEqual([
      { role: "system", content: "system prompt" },
      { role: "user", content: "necesito escenarios de login" },
    ]);
  });

  it("lanza ModelNotFoundError si el modelo no existe", () => {
    const builder = createGherkinCapabilityContextBuilder(createFakePromptManager());
    const conversation = Conversation.start();

    expect(() => builder.build({ conversation, modelId: "no-existe" })).toThrow(ModelNotFoundError);
  });

  it("propaga la señal de cancelación en el contexto", () => {
    const builder = createGherkinCapabilityContextBuilder(createFakePromptManager());
    const conversation = Conversation.start();
    const controller = new AbortController();

    const context = builder.build({
      conversation,
      modelId: "gemini-2.5-flash",
      signal: controller.signal,
    });

    expect(context.signal).toBe(controller.signal);
  });
});

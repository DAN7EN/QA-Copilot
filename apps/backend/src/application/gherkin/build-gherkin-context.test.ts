import { describe, expect, it } from "vitest";
import { buildGherkinContext } from "./build-gherkin-context.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";

function createFakePromptManager(systemPrompt: string): PromptManager {
  return {
    render: () => systemPrompt,
  };
}

describe("buildGherkinContext", () => {
  it("antepone el System Prompt de Gherkin al historial de la conversación", () => {
    const conversation = Conversation.start();
    conversation.addMessage("user", "Como usuario quiero iniciar sesión con email y contraseña");

    const context = buildGherkinContext(
      conversation,
      createFakePromptManager("eres un experto en BDD"),
    );

    expect(context).toEqual([
      { role: "system", content: "eres un experto en BDD" },
      { role: "user", content: "Como usuario quiero iniciar sesión con email y contraseña" },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { buildConversationContext } from "./build-conversation-context.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";

function createFakePromptManager(systemPrompt: string): PromptManager {
  return {
    render: () => systemPrompt,
  };
}

describe("buildConversationContext", () => {
  it("antepone el System Prompt al historial de la conversación", () => {
    const conversation = Conversation.start();
    conversation.addMessage("user", "hola");
    conversation.addMessage("assistant", "¿en qué puedo ayudarte?");
    conversation.addMessage("user", "necesito un caso de prueba");

    const context = buildConversationContext(
      conversation,
      createFakePromptManager("eres QA Copilot"),
    );

    expect(context).toEqual([
      { role: "system", content: "eres QA Copilot" },
      { role: "user", content: "hola" },
      { role: "assistant", content: "¿en qué puedo ayudarte?" },
      { role: "user", content: "necesito un caso de prueba" },
    ]);
  });

  it("el System Prompt sigue presente aunque la conversación no tenga mensajes todavía", () => {
    const conversation = Conversation.start();

    const context = buildConversationContext(
      conversation,
      createFakePromptManager("eres QA Copilot"),
    );

    expect(context).toEqual([{ role: "system", content: "eres QA Copilot" }]);
  });
});

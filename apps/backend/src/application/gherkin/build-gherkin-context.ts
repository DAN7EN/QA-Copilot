import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { PromptMessage } from "../../domain/prompt/value-objects/prompt-message.vo.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";

const GHERKIN_SYSTEM_PROMPT_ID = "gherkin.system";

/**
 * Igual que `buildConversationContext` (Chat), pero con el System Prompt de la
 * capacidad Gherkin: System Prompt (Prompt Manager) + historial de la
 * conversación, que contiene el requisito o historia de usuario a convertir.
 */
export function buildGherkinContext(
  conversation: Conversation,
  promptManager: PromptManager,
): PromptMessage[] {
  const systemPrompt = promptManager.render({ id: GHERKIN_SYSTEM_PROMPT_ID });

  const history: PromptMessage[] = conversation.getMessages().map((message) => ({
    role: message.getRole(),
    content: message.getContent().toString(),
  }));

  return [{ role: "system", content: systemPrompt }, ...history];
}

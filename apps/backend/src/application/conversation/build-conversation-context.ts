import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { PromptMessage } from "../../domain/prompt/value-objects/prompt-message.vo.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";

const CHAT_SYSTEM_PROMPT_ID = "chat.system";

/**
 * Ensambla el contexto completo que se envía al proveedor de IA: System
 * Prompt (Prompt Manager) + historial de la conversación. El mensaje actual
 * ya forma parte del historial (es el último mensaje agregado antes de
 * generar), por lo que no se maneja como un elemento aparte.
 */
export function buildConversationContext(
  conversation: Conversation,
  promptManager: PromptManager,
): PromptMessage[] {
  const systemPrompt = promptManager.render({ id: CHAT_SYSTEM_PROMPT_ID });

  const history: PromptMessage[] = conversation.getMessages().map((message) => ({
    role: message.getRole(),
    content: message.getContent().toString(),
  }));

  return [{ role: "system", content: systemPrompt }, ...history];
}

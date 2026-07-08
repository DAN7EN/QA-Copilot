import type { Message } from "../../domain/conversation/entities/message.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";
import { getModelOrThrow } from "../../domain/ai-model/model-registry.js";
import { AIProviderInvalidResponseError } from "../../domain/ai-model/errors/ai-model.errors.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";
import { buildConversationContext } from "./build-conversation-context.js";

export interface StreamAssistantReplyInput {
  conversationId: string;
  modelId: string;
  signal?: AbortSignal;
}

/**
 * Un evento de una generación en curso. Una conversación (el agregado
 * persistente) puede tener múltiples generaciones a lo largo del tiempo; este
 * tipo representa el ciclo de vida de una sola de ellas, no la conversación.
 */
export type GenerationStreamEvent =
  { type: "chunk"; delta: string } | { type: "completed"; message: Message };

export interface StreamAssistantReplyUseCase {
  execute(input: StreamAssistantReplyInput): AsyncGenerator<GenerationStreamEvent>;
}

export function createStreamAssistantReplyUseCase(
  repository: ConversationRepositoryPort,
  aiProvider: AIProviderPort,
  promptManager: PromptManager,
): StreamAssistantReplyUseCase {
  return {
    async *execute({
      conversationId,
      modelId,
      signal,
    }: StreamAssistantReplyInput): AsyncGenerator<GenerationStreamEvent> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      const model = getModelOrThrow(modelId);
      const messages = buildConversationContext(conversation, promptManager);

      let fullContent = "";
      for await (const chunk of aiProvider.streamReply(messages, model.getId(), signal)) {
        fullContent += chunk.delta;
        yield { type: "chunk", delta: chunk.delta };
      }

      if (fullContent.trim().length === 0) {
        throw new AIProviderInvalidResponseError();
      }

      const message = conversation.addMessage("assistant", fullContent);
      await repository.save(conversation);

      yield { type: "completed", message };
    },
  };
}

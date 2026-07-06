import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";
import { getModelOrThrow } from "../../domain/ai-model/model-registry.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";

export interface GenerateAssistantReplyInput {
  conversationId: string;
  modelId: string;
  signal?: AbortSignal;
}

export interface GenerateAssistantReplyUseCase {
  execute(input: GenerateAssistantReplyInput): Promise<Conversation>;
}

export function createGenerateAssistantReplyUseCase(
  repository: ConversationRepositoryPort,
  aiProvider: AIProviderPort,
): GenerateAssistantReplyUseCase {
  return {
    async execute({
      conversationId,
      modelId,
      signal,
    }: GenerateAssistantReplyInput): Promise<Conversation> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      const model = getModelOrThrow(modelId);

      const reply = await aiProvider.generateReply(conversation, model.getId(), signal);
      conversation.addMessage("assistant", reply.toString());
      await repository.save(conversation);

      return conversation;
    },
  };
}

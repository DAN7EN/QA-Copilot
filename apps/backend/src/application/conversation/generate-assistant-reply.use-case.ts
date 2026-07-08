import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";
import { getModelOrThrow } from "../../domain/ai-model/model-registry.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";
import { buildConversationContext } from "./build-conversation-context.js";

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
  promptManager: PromptManager,
): GenerateAssistantReplyUseCase {
  return {
    async execute({
      conversationId,
      modelId,
      signal,
    }: GenerateAssistantReplyInput): Promise<Conversation> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      const model = getModelOrThrow(modelId);
      const messages = buildConversationContext(conversation, promptManager);

      const reply = await aiProvider.generateReply(messages, model.getId(), signal);
      conversation.addMessage("assistant", reply.toString());
      await repository.save(conversation);

      return conversation;
    },
  };
}

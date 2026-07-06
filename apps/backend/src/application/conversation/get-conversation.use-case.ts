import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";

export interface GetConversationInput {
  conversationId: string;
}

export interface GetConversationUseCase {
  execute(input: GetConversationInput): Promise<Conversation>;
}

export function createGetConversationUseCase(
  repository: ConversationRepositoryPort,
): GetConversationUseCase {
  return {
    async execute({ conversationId }: GetConversationInput): Promise<Conversation> {
      return findConversationOrThrow(repository, conversationId);
    },
  };
}

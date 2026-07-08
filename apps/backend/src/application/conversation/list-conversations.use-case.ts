import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";

export interface ListConversationsUseCase {
  execute(): Promise<Conversation[]>;
}

export function createListConversationsUseCase(
  repository: ConversationRepositoryPort,
): ListConversationsUseCase {
  return {
    async execute(): Promise<Conversation[]> {
      return repository.findAll();
    },
  };
}

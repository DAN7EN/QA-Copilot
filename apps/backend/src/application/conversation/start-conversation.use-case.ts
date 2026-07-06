import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";

export interface StartConversationUseCase {
  execute(): Promise<Conversation>;
}

export function createStartConversationUseCase(
  repository: ConversationRepositoryPort,
): StartConversationUseCase {
  return {
    async execute(): Promise<Conversation> {
      const conversation = Conversation.start();
      await repository.save(conversation);
      return conversation;
    },
  };
}

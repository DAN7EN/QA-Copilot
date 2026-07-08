import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";

export interface RenameConversationInput {
  conversationId: string;
  title: string;
}

export interface RenameConversationUseCase {
  execute(input: RenameConversationInput): Promise<Conversation>;
}

export function createRenameConversationUseCase(
  repository: ConversationRepositoryPort,
): RenameConversationUseCase {
  return {
    async execute({ conversationId, title }: RenameConversationInput): Promise<Conversation> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      conversation.rename(title);
      await repository.save(conversation);
      return conversation;
    },
  };
}

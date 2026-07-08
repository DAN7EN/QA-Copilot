import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";

export interface DeleteConversationInput {
  conversationId: string;
}

export interface DeleteConversationUseCase {
  execute(input: DeleteConversationInput): Promise<void>;
}

export function createDeleteConversationUseCase(
  repository: ConversationRepositoryPort,
): DeleteConversationUseCase {
  return {
    async execute({ conversationId }: DeleteConversationInput): Promise<void> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      await repository.delete(conversation.getId());
    },
  };
}

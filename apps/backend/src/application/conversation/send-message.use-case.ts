import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import { findConversationOrThrow } from "./find-conversation-or-throw.js";

export interface SendMessageInput {
  conversationId: string;
  content: string;
}

export interface SendMessageUseCase {
  execute(input: SendMessageInput): Promise<Conversation>;
}

export function createSendMessageUseCase(
  repository: ConversationRepositoryPort,
): SendMessageUseCase {
  return {
    async execute({ conversationId, content }: SendMessageInput): Promise<Conversation> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      conversation.addMessage("user", content);
      await repository.save(conversation);
      return conversation;
    },
  };
}

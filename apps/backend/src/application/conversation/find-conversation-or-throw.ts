import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";
import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationId } from "../../domain/conversation/value-objects/conversation-id.vo.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";

export async function findConversationOrThrow(
  repository: ConversationRepositoryPort,
  rawConversationId: string,
): Promise<Conversation> {
  const conversationId = ConversationId.fromString(rawConversationId);
  const conversation = await repository.findById(conversationId);

  if (!conversation) {
    throw new ConversationNotFoundError(rawConversationId);
  }

  return conversation;
}

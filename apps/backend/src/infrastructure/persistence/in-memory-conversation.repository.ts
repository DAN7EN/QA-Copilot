import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import type { ConversationId } from "../../domain/conversation/value-objects/conversation-id.vo.js";

export class InMemoryConversationRepository implements ConversationRepositoryPort {
  private readonly conversations = new Map<string, Conversation>();

  async save(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.getId().toString(), conversation);
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    return this.conversations.get(id.toString()) ?? null;
  }
}

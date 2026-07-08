import type { Conversation } from "../entities/conversation.entity.js";
import type { ConversationId } from "../value-objects/conversation-id.vo.js";

export interface ConversationRepositoryPort {
  save(conversation: Conversation): Promise<void>;
  findById(id: ConversationId): Promise<Conversation | null>;
  /** Ordenadas por fecha de actualización descendente (más reciente primero). */
  findAll(): Promise<Conversation[]>;
  delete(id: ConversationId): Promise<void>;
}

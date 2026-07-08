import type { Pool } from "pg";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { Message } from "../../domain/conversation/entities/message.entity.js";
import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import { ConversationId } from "../../domain/conversation/value-objects/conversation-id.vo.js";
import { MessageId } from "../../domain/conversation/value-objects/message-id.vo.js";

type ConversationRow = {
  id: string;
  created_at: Date;
  updated_at: Date;
  title: string | null;
};

type MessageRow = {
  id: string;
  role: string;
  content: string;
  created_at: Date;
};

function toConversation(
  conversationRow: ConversationRow,
  messageRows: readonly MessageRow[],
): Conversation {
  const messages = messageRows.map((row) =>
    Message.reconstitute(MessageId.fromString(row.id), row.role, row.content, row.created_at),
  );

  return Conversation.reconstitute(
    ConversationId.fromString(conversationRow.id),
    conversationRow.created_at,
    conversationRow.updated_at,
    messages,
    conversationRow.title,
  );
}

/**
 * Adaptador PostgreSQL del `ConversationRepositoryPort`. El dominio no sabe
 * que esta clase existe: solo conoce el puerto. Persiste exactamente lo que
 * `Conversation`/`Message` exponen (id, fechas, mensajes) — nada de lo que
 * este sprint deja explícitamente fuera de alcance (prompts, capabilities,
 * métricas, etc.).
 */
export class PostgresConversationRepository implements ConversationRepositoryPort {
  constructor(private readonly pool: Pool) {}

  async save(conversation: Conversation): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO conversations (id, created_at, updated_at, title)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at, title = EXCLUDED.title`,
        [
          conversation.getId().toString(),
          conversation.getCreatedAt(),
          conversation.getUpdatedAt(),
          conversation.getTitle(),
        ],
      );

      for (const message of conversation.getMessages()) {
        await client.query(
          `INSERT INTO messages (id, conversation_id, role, content, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [
            message.getId().toString(),
            conversation.getId().toString(),
            message.getRole(),
            message.getContent().toString(),
            message.getCreatedAt(),
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: ConversationId): Promise<Conversation | null> {
    const conversationResult = await this.pool.query<ConversationRow>(
      "SELECT id, created_at, updated_at, title FROM conversations WHERE id = $1",
      [id.toString()],
    );
    const conversationRow = conversationResult.rows[0];

    if (!conversationRow) {
      return null;
    }

    const messagesResult = await this.pool.query<MessageRow>(
      "SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [id.toString()],
    );

    return toConversation(conversationRow, messagesResult.rows);
  }

  async findAll(): Promise<Conversation[]> {
    const conversationsResult = await this.pool.query<ConversationRow>(
      "SELECT id, created_at, updated_at, title FROM conversations ORDER BY updated_at DESC",
    );

    if (conversationsResult.rows.length === 0) {
      return [];
    }

    const conversationIds = conversationsResult.rows.map((row) => row.id);
    const messagesResult = await this.pool.query<MessageRow & { conversation_id: string }>(
      "SELECT id, conversation_id, role, content, created_at FROM messages WHERE conversation_id = ANY($1::uuid[]) ORDER BY created_at ASC",
      [conversationIds],
    );

    const messageRowsByConversationId = new Map<string, MessageRow[]>();
    for (const row of messagesResult.rows) {
      const existing = messageRowsByConversationId.get(row.conversation_id) ?? [];
      existing.push(row);
      messageRowsByConversationId.set(row.conversation_id, existing);
    }

    return conversationsResult.rows.map((row) =>
      toConversation(row, messageRowsByConversationId.get(row.id) ?? []),
    );
  }

  async delete(id: ConversationId): Promise<void> {
    await this.pool.query("DELETE FROM conversations WHERE id = $1", [id.toString()]);
  }
}

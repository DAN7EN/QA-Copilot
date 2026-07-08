import { describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { PostgresConversationRepository } from "./postgres-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationId } from "../../domain/conversation/value-objects/conversation-id.vo.js";

function createFakePool() {
  const clientQuery = vi.fn().mockResolvedValue({ rows: [] });
  const release = vi.fn();
  const connect = vi.fn().mockResolvedValue({ query: clientQuery, release });
  const poolQuery = vi.fn().mockResolvedValue({ rows: [] });

  const pool = { query: poolQuery, connect } as unknown as Pool;

  return { pool, clientQuery, release, connect, poolQuery };
}

describe("PostgresConversationRepository", () => {
  describe("save", () => {
    it("persiste la conversación y sus mensajes dentro de una transacción", async () => {
      const { pool, clientQuery, release } = createFakePool();
      const repository = new PostgresConversationRepository(pool);
      const conversation = Conversation.start();
      conversation.addMessage("user", "hola");

      await repository.save(conversation);

      const calls = clientQuery.mock.calls.map((call) => call[0] as string);
      expect(calls[0]).toBe("BEGIN");
      expect(calls[1]).toContain("INSERT INTO conversations");
      expect(calls[2]).toContain("INSERT INTO messages");
      expect(calls[3]).toBe("COMMIT");

      const conversationParams = clientQuery.mock.calls[1]?.[1] as unknown[];
      expect(conversationParams[0]).toBe(conversation.getId().toString());

      const messageParams = clientQuery.mock.calls[2]?.[1] as unknown[];
      expect(messageParams).toEqual([
        conversation.getMessages()[0]?.getId().toString(),
        conversation.getId().toString(),
        "user",
        "hola",
        conversation.getMessages()[0]?.getCreatedAt(),
      ]);

      expect(release).toHaveBeenCalledTimes(1);
    });

    it("hace rollback y relanza el error si alguna query falla", async () => {
      const { pool, clientQuery, release } = createFakePool();
      clientQuery.mockImplementation((sql: string) => {
        if (sql.includes("INSERT INTO conversations")) {
          return Promise.reject(new Error("db down"));
        }
        return Promise.resolve({ rows: [] });
      });
      const repository = new PostgresConversationRepository(pool);

      await expect(repository.save(Conversation.start())).rejects.toThrow("db down");

      expect(clientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(release).toHaveBeenCalledTimes(1);
    });
  });

  describe("findById", () => {
    it("devuelve null si la conversación no existe", async () => {
      const { pool } = createFakePool();
      const repository = new PostgresConversationRepository(pool);

      const found = await repository.findById(ConversationId.generate());

      expect(found).toBeNull();
    });

    it("reconstruye la conversación con sus mensajes en orden", async () => {
      const { pool, poolQuery } = createFakePool();
      const id = ConversationId.generate();
      const createdAt = new Date("2024-01-01T00:00:00.000Z");
      const updatedAt = new Date("2024-01-02T00:00:00.000Z");

      poolQuery.mockResolvedValueOnce({
        rows: [{ id: id.toString(), created_at: createdAt, updated_at: updatedAt }],
      });
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            role: "user",
            content: "hola",
            created_at: createdAt,
          },
        ],
      });

      const repository = new PostgresConversationRepository(pool);
      const found = await repository.findById(id);

      expect(found?.getId().equals(id)).toBe(true);
      expect(found?.getMessages()).toHaveLength(1);
      expect(found?.getMessages()[0]?.getContent().toString()).toBe("hola");
    });
  });

  describe("findAll", () => {
    it("devuelve un array vacío si no hay conversaciones", async () => {
      const { pool } = createFakePool();
      const repository = new PostgresConversationRepository(pool);

      const all = await repository.findAll();

      expect(all).toEqual([]);
    });

    it("agrupa los mensajes por conversación y conserva el orden de la consulta", async () => {
      const { pool, poolQuery } = createFakePool();
      const idA = ConversationId.generate();
      const idB = ConversationId.generate();
      const now = new Date("2024-01-01T00:00:00.000Z");

      poolQuery.mockResolvedValueOnce({
        rows: [
          { id: idA.toString(), created_at: now, updated_at: now },
          { id: idB.toString(), created_at: now, updated_at: now },
        ],
      });
      poolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            conversation_id: idB.toString(),
            role: "user",
            content: "para B",
            created_at: now,
          },
        ],
      });

      const repository = new PostgresConversationRepository(pool);
      const all = await repository.findAll();

      expect(all).toHaveLength(2);
      expect(all[0]?.getMessages()).toHaveLength(0);
      expect(all[1]?.getMessages()).toHaveLength(1);
      expect(all[1]?.getMessages()[0]?.getContent().toString()).toBe("para B");
    });
  });
});

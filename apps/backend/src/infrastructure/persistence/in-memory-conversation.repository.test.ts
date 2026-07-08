import { describe, expect, it } from "vitest";
import { InMemoryConversationRepository } from "./in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationId } from "../../domain/conversation/value-objects/conversation-id.vo.js";

describe("InMemoryConversationRepository", () => {
  it("devuelve null cuando la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();

    const found = await repository.findById(ConversationId.generate());

    expect(found).toBeNull();
  });

  it("guarda y recupera una conversación por id", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();

    await repository.save(conversation);
    const found = await repository.findById(conversation.getId());

    expect(found).toBe(conversation);
  });

  it("sobrescribe la conversación al guardarla de nuevo con el mismo id", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);

    conversation.addMessage("user", "hola");
    await repository.save(conversation);
    const found = await repository.findById(conversation.getId());

    expect(found?.getMessages()).toHaveLength(1);
  });

  it("findAll devuelve las conversaciones ordenadas por updatedAt descendente", async () => {
    const repository = new InMemoryConversationRepository();
    const older = Conversation.reconstitute(
      ConversationId.generate(),
      new Date("2024-01-01T00:00:00.000Z"),
      new Date("2024-01-01T00:00:00.000Z"),
      [],
    );
    const newer = Conversation.reconstitute(
      ConversationId.generate(),
      new Date("2024-01-02T00:00:00.000Z"),
      new Date("2024-01-03T00:00:00.000Z"),
      [],
    );

    await repository.save(older);
    await repository.save(newer);
    const all = await repository.findAll();

    expect(all.map((conversation) => conversation.getId().toString())).toEqual([
      newer.getId().toString(),
      older.getId().toString(),
    ]);
  });

  it("delete elimina la conversación", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);

    await repository.delete(conversation.getId());
    const found = await repository.findById(conversation.getId());

    expect(found).toBeNull();
  });

  it("delete no falla si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();

    await expect(repository.delete(ConversationId.generate())).resolves.toBeUndefined();
  });
});

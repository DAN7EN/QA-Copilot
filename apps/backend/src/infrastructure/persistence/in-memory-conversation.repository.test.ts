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
});

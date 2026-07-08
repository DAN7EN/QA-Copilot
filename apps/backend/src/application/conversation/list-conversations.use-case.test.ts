import { describe, expect, it } from "vitest";
import { createListConversationsUseCase } from "./list-conversations.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";

describe("ListConversationsUseCase", () => {
  it("devuelve las conversaciones del repositorio", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createListConversationsUseCase(repository);

    const conversations = await useCase.execute();

    expect(conversations.map((item) => item.getId().toString())).toEqual([
      conversation.getId().toString(),
    ]);
  });

  it("devuelve un array vacío si no hay conversaciones", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createListConversationsUseCase(repository);

    expect(await useCase.execute()).toEqual([]);
  });
});

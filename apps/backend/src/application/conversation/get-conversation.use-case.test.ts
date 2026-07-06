import { describe, expect, it } from "vitest";
import { createGetConversationUseCase } from "./get-conversation.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";

describe("GetConversationUseCase", () => {
  it("devuelve la conversación existente", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createGetConversationUseCase(repository);

    const found = await useCase.execute({ conversationId: conversation.getId().toString() });

    expect(found).toBe(conversation);
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createGetConversationUseCase(repository);

    await expect(useCase.execute({ conversationId: "no-existe" })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });
});

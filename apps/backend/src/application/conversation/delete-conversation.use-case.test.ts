import { describe, expect, it } from "vitest";
import { createDeleteConversationUseCase } from "./delete-conversation.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";

describe("DeleteConversationUseCase", () => {
  it("elimina la conversación existente", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createDeleteConversationUseCase(repository);

    await useCase.execute({ conversationId: conversation.getId().toString() });

    const found = await repository.findById(conversation.getId());
    expect(found).toBeNull();
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createDeleteConversationUseCase(repository);

    await expect(useCase.execute({ conversationId: "no-existe" })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });
});

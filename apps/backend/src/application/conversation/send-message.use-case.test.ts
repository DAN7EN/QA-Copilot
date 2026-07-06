import { describe, expect, it } from "vitest";
import { createSendMessageUseCase } from "./send-message.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";

describe("SendMessageUseCase", () => {
  it("agrega un mensaje de usuario a una conversación existente", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createSendMessageUseCase(repository);

    const updated = await useCase.execute({
      conversationId: conversation.getId().toString(),
      content: "hola",
    });

    expect(updated.getMessages()).toHaveLength(1);
    expect(updated.getMessages()[0]?.getRole()).toBe("user");
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createSendMessageUseCase(repository);

    await expect(useCase.execute({ conversationId: "no-existe", content: "hola" })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });
});

import { describe, expect, it } from "vitest";
import { createRenameConversationUseCase } from "./rename-conversation.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import {
  ConversationNotFoundError,
  EmptyConversationTitleError,
} from "../../domain/conversation/errors/conversation.errors.js";

describe("RenameConversationUseCase", () => {
  it("renombra y persiste la conversación existente", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createRenameConversationUseCase(repository);

    const renamed = await useCase.execute({
      conversationId: conversation.getId().toString(),
      title: "Nuevo título",
    });

    expect(renamed.getTitle()).toBe("Nuevo título");
    const persisted = await repository.findById(conversation.getId());
    expect(persisted?.getTitle()).toBe("Nuevo título");
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createRenameConversationUseCase(repository);

    await expect(useCase.execute({ conversationId: "no-existe", title: "Título" })).rejects.toThrow(
      ConversationNotFoundError,
    );
  });

  it("lanza EmptyConversationTitleError si el título está vacío", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createRenameConversationUseCase(repository);

    await expect(
      useCase.execute({ conversationId: conversation.getId().toString(), title: "   " }),
    ).rejects.toThrow(EmptyConversationTitleError);
  });
});

import { describe, expect, it } from "vitest";
import { createStartConversationUseCase } from "./start-conversation.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";

describe("StartConversationUseCase", () => {
  it("crea una conversación vacía y la persiste en el repositorio", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createStartConversationUseCase(repository);

    const conversation = await useCase.execute();

    expect(conversation.getMessages()).toHaveLength(0);
    await expect(repository.findById(conversation.getId())).resolves.toBe(conversation);
  });
});

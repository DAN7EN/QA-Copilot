import { describe, expect, it, vi } from "vitest";
import { createGenerateAssistantReplyUseCase } from "./generate-assistant-reply.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";
import { ModelNotFoundError } from "../../domain/ai-model/errors/ai-model.errors.js";
import { MessageContent } from "../../domain/conversation/value-objects/message-content.vo.js";
import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";

function createFakeAIProvider(replyText = "hola, ¿en qué puedo ayudarte?"): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create(replyText),
  };
}

describe("GenerateAssistantReplyUseCase", () => {
  it("genera y persiste una respuesta del asistente en la conversación", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    conversation.addMessage("user", "hola");
    await repository.save(conversation);
    const useCase = createGenerateAssistantReplyUseCase(repository, createFakeAIProvider());

    const updated = await useCase.execute({
      conversationId: conversation.getId().toString(),
      modelId: "gemini-2.5-flash",
    });

    expect(updated.getMessages()).toHaveLength(2);
    expect(updated.getMessages()[1]?.getRole()).toBe("assistant");
    expect(updated.getMessages()[1]?.getContent().toString()).toBe("hola, ¿en qué puedo ayudarte?");
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createGenerateAssistantReplyUseCase(repository, createFakeAIProvider());

    await expect(
      useCase.execute({ conversationId: "no-existe", modelId: "gemini-2.5-flash" }),
    ).rejects.toThrow(ConversationNotFoundError);
  });

  it("lanza ModelNotFoundError si el modelo no existe en el registro", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createGenerateAssistantReplyUseCase(repository, createFakeAIProvider());

    await expect(
      useCase.execute({ conversationId: conversation.getId().toString(), modelId: "no-existe" }),
    ).rejects.toThrow(ModelNotFoundError);
  });

  it("propaga la señal de cancelación recibida hacia el proveedor de IA", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const generateReply = vi.fn().mockResolvedValue(MessageContent.create("ok"));
    const useCase = createGenerateAssistantReplyUseCase(repository, { generateReply });
    const controller = new AbortController();

    await useCase.execute({
      conversationId: conversation.getId().toString(),
      modelId: "gemini-2.5-flash",
      signal: controller.signal,
    });

    expect(generateReply).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      controller.signal,
    );
  });
});

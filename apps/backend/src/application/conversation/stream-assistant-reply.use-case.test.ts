import { describe, expect, it } from "vitest";
import { createStreamAssistantReplyUseCase } from "./stream-assistant-reply.use-case.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";
import {
  ModelNotFoundError,
  AIProviderInvalidResponseError,
} from "../../domain/ai-model/errors/ai-model.errors.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../domain/conversation/ports/ai-provider.port.js";
import { createPromptManager } from "../../domain/prompt/prompt-manager.js";

function createFakeStreamingProvider(deltas: string[]): AIProviderPort {
  return {
    generateReply: () => {
      throw new Error("not used in these tests");
    },
    async *streamReply(): AsyncIterable<AIGenerationChunk> {
      for (const delta of deltas) {
        yield { type: "content", delta };
      }
    },
  };
}

async function collectEvents<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const events: T[] = [];
  for await (const event of generator) {
    events.push(event);
  }
  return events;
}

describe("StreamAssistantReplyUseCase", () => {
  it("emite un evento por chunk y un evento final con el mensaje persistido", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    conversation.addMessage("user", "hola");
    await repository.save(conversation);
    const useCase = createStreamAssistantReplyUseCase(
      repository,
      createFakeStreamingProvider(["Hola", " mundo"]),
      createPromptManager(),
    );

    const events = await collectEvents(
      useCase.execute({
        conversationId: conversation.getId().toString(),
        modelId: "gemini-2.5-flash",
      }),
    );

    expect(events).toEqual([
      { type: "chunk", delta: "Hola" },
      { type: "chunk", delta: " mundo" },
      { type: "completed", message: expect.anything() },
    ]);

    const completedEvent = events[2] as {
      type: "completed";
      message: { getContent(): { toString(): string } };
    };
    expect(completedEvent.message.getContent().toString()).toBe("Hola mundo");

    const persisted = await repository.findById(conversation.getId());
    expect(persisted?.getMessages()).toHaveLength(2);
    expect(persisted?.getMessages()[1]?.getRole()).toBe("assistant");
  });

  it("lanza ConversationNotFoundError sin emitir ningún chunk si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createStreamAssistantReplyUseCase(
      repository,
      createFakeStreamingProvider(["hola"]),
      createPromptManager(),
    );

    await expect(
      collectEvents(useCase.execute({ conversationId: "no-existe", modelId: "gemini-2.5-flash" })),
    ).rejects.toThrow(ConversationNotFoundError);
  });

  it("lanza ModelNotFoundError si el modelo no existe en el registro", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createStreamAssistantReplyUseCase(
      repository,
      createFakeStreamingProvider(["hola"]),
      createPromptManager(),
    );

    await expect(
      collectEvents(
        useCase.execute({ conversationId: conversation.getId().toString(), modelId: "no-existe" }),
      ),
    ).rejects.toThrow(ModelNotFoundError);
  });

  it("lanza AIProviderInvalidResponseError y no persiste nada si no llega ningún chunk", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    await repository.save(conversation);
    const useCase = createStreamAssistantReplyUseCase(
      repository,
      createFakeStreamingProvider([]),
      createPromptManager(),
    );

    await expect(
      collectEvents(
        useCase.execute({
          conversationId: conversation.getId().toString(),
          modelId: "gemini-2.5-flash",
        }),
      ),
    ).rejects.toThrow(AIProviderInvalidResponseError);

    const persisted = await repository.findById(conversation.getId());
    expect(persisted?.getMessages()).toHaveLength(0);
  });
});

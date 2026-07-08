import { describe, expect, it } from "vitest";
import { createGenerateGherkinUseCase } from "./generate-gherkin.use-case.js";
import { createGherkinCapabilityContextBuilder } from "./gherkin-context.builder.js";
import { createGherkinCapabilityHandler } from "./gherkin-capability.handler.js";
import { createGherkinOutputParser } from "./gherkin-output.parser.js";
import { InMemoryConversationRepository } from "../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ConversationNotFoundError } from "../../domain/conversation/errors/conversation.errors.js";
import { MessageContent } from "../../domain/conversation/value-objects/message-content.vo.js";
import { createPromptManager } from "../../domain/prompt/prompt-manager.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../domain/conversation/ports/ai-provider.port.js";

function createFakeAIProvider(replyText: string): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create(replyText),
    streamReply(): AsyncIterable<AIGenerationChunk> {
      throw new Error("not used in this test");
    },
  };
}

function createUseCase(repository: InMemoryConversationRepository, replyText: string) {
  const promptManager = createPromptManager();
  const contextBuilder = createGherkinCapabilityContextBuilder(promptManager);
  const outputParser = createGherkinOutputParser();
  const handler = createGherkinCapabilityHandler(createFakeAIProvider(replyText), outputParser);

  return createGenerateGherkinUseCase(repository, contextBuilder, handler);
}

describe("GenerateGherkinUseCase", () => {
  it("genera un GherkinResult estructurado sin modificar la conversación", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    conversation.addMessage("user", "necesito escenarios para el login");
    await repository.save(conversation);

    const markdown = "Feature: Login\n\nScenario: OK\nGiven algo\nWhen otra cosa\nThen resultado";
    const useCase = createUseCase(repository, markdown);

    const result = await useCase.execute({
      conversationId: conversation.getId().toString(),
      modelId: "gemini-2.5-flash",
    });

    expect(result.title).toBe("Login");
    expect(result.scenarios).toHaveLength(1);
    expect(result.rawMarkdown).toBe(markdown);

    const persisted = await repository.findById(conversation.getId());
    expect(persisted?.getMessages()).toHaveLength(1);
  });

  it("lanza ConversationNotFoundError si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const useCase = createUseCase(repository, "Feature: X");

    await expect(
      useCase.execute({ conversationId: "no-existe", modelId: "gemini-2.5-flash" }),
    ).rejects.toThrow(ConversationNotFoundError);
  });
});

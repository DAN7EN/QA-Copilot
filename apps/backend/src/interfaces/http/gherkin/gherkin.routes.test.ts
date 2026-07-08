import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerGherkinRoutes } from "./gherkin.routes.js";
import { createGenerateGherkinUseCase } from "../../../application/gherkin/generate-gherkin.use-case.js";
import { createGherkinCapabilityContextBuilder } from "../../../application/gherkin/gherkin-context.builder.js";
import { createGherkinCapabilityHandler } from "../../../application/gherkin/gherkin-capability.handler.js";
import { createGherkinOutputParser } from "../../../application/gherkin/gherkin-output.parser.js";
import { InMemoryConversationRepository } from "../../../infrastructure/persistence/in-memory-conversation.repository.js";
import { Conversation } from "../../../domain/conversation/entities/conversation.entity.js";
import { MessageContent } from "../../../domain/conversation/value-objects/message-content.vo.js";
import { createPromptManager } from "../../../domain/prompt/prompt-manager.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../../domain/conversation/ports/ai-provider.port.js";

function createFakeAIProvider(replyText: string): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create(replyText),
    streamReply(): AsyncIterable<AIGenerationChunk> {
      throw new Error("not used in this test");
    },
  };
}

function buildApp(repository: InMemoryConversationRepository, replyText: string) {
  const app = Fastify();
  const promptManager = createPromptManager();
  const contextBuilder = createGherkinCapabilityContextBuilder(promptManager);
  const outputParser = createGherkinOutputParser();
  const handler = createGherkinCapabilityHandler(createFakeAIProvider(replyText), outputParser);

  registerGherkinRoutes(app, {
    generateGherkin: createGenerateGherkinUseCase(repository, contextBuilder, handler),
  });

  return app;
}

describe("Gherkin routes", () => {
  it("POST /api/v1/conversations/:id/capabilities/gherkin devuelve un GherkinResult", async () => {
    const repository = new InMemoryConversationRepository();
    const conversation = Conversation.start();
    conversation.addMessage("user", "necesito escenarios para el checkout");
    await repository.save(conversation);

    const app = buildApp(repository, "Feature: Checkout\n\nScenario: Pago exitoso\nGiven algo");

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${conversation.getId().toString()}/capabilities/gherkin`,
      payload: { modelId: "gemini-2.5-flash" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      title: "Checkout",
      feature: "",
      scenarios: [{ title: "Pago exitoso", steps: ["Given algo"] }],
      rawMarkdown: "Feature: Checkout\n\nScenario: Pago exitoso\nGiven algo",
    });
  });

  it("responde 400 si falta modelId", async () => {
    const repository = new InMemoryConversationRepository();
    const app = buildApp(repository, "Feature: X");

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/conversations/any-id/capabilities/gherkin",
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe("HTTP.INVALID_BODY");
  });

  it("responde 404 si la conversación no existe", async () => {
    const repository = new InMemoryConversationRepository();
    const app = buildApp(repository, "Feature: X");

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/conversations/no-existe/capabilities/gherkin",
      payload: { modelId: "gemini-2.5-flash" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("CONVERSATION.NOT_FOUND");
  });
});

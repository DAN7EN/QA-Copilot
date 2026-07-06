import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerConversationRoutes } from "./conversation.routes.js";
import { InMemoryConversationRepository } from "../../../infrastructure/persistence/in-memory-conversation.repository.js";
import { createStartConversationUseCase } from "../../../application/conversation/start-conversation.use-case.js";
import { createSendMessageUseCase } from "../../../application/conversation/send-message.use-case.js";
import { createGetConversationUseCase } from "../../../application/conversation/get-conversation.use-case.js";
import { createGenerateAssistantReplyUseCase } from "../../../application/conversation/generate-assistant-reply.use-case.js";
import { MessageContent } from "../../../domain/conversation/value-objects/message-content.vo.js";
import type { AIProviderPort } from "../../../domain/conversation/ports/ai-provider.port.js";

function createFakeAIProvider(): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create("respuesta simulada"),
  };
}

function buildApp() {
  const app = Fastify();
  const repository = new InMemoryConversationRepository();

  registerConversationRoutes(app, {
    startConversation: createStartConversationUseCase(repository),
    sendMessage: createSendMessageUseCase(repository),
    getConversation: createGetConversationUseCase(repository),
    generateAssistantReply: createGenerateAssistantReplyUseCase(repository, createFakeAIProvider()),
  });

  return app;
}

describe("Conversation routes", () => {
  it("POST /api/v1/conversations crea una conversación vacía", async () => {
    const app = buildApp();

    const response = await app.inject({ method: "POST", url: "/api/v1/conversations" });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ messages: [] });
  });

  it("POST /api/v1/conversations/:id/messages agrega un mensaje", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/messages`,
      payload: { content: "hola" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().messages).toMatchObject([{ role: "user", content: "hola" }]);
  });

  it("POST /api/v1/conversations/:id/messages responde 400 si falta el contenido", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/messages`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("POST /api/v1/conversations/:id/messages responde 404 si la conversación no existe", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/conversations/no-existe/messages",
      payload: { content: "hola" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("GET /api/v1/conversations/:id devuelve la conversación", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({ method: "GET", url: `/api/v1/conversations/${id}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id });
  });

  it("GET /api/v1/conversations/:id responde 404 si la conversación no existe", async () => {
    const app = buildApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/conversations/no-existe" });

    expect(response.statusCode).toBe(404);
  });

  it("POST /api/v1/conversations/:id/generate agrega una respuesta del asistente", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate`,
      payload: { modelId: "gemini-2.5-flash" },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().messages).toMatchObject([
      { role: "assistant", content: "respuesta simulada" },
    ]);
  });

  it("POST /api/v1/conversations/:id/generate responde 400 si falta el modelId", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("POST /api/v1/conversations/:id/generate responde 404 si el modelo no existe", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate`,
      payload: { modelId: "no-existe" },
    });

    expect(response.statusCode).toBe(404);
  });
});

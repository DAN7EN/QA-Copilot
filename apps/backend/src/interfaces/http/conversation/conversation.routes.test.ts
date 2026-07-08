import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerConversationRoutes } from "./conversation.routes.js";
import { InMemoryConversationRepository } from "../../../infrastructure/persistence/in-memory-conversation.repository.js";
import { createStartConversationUseCase } from "../../../application/conversation/start-conversation.use-case.js";
import { createSendMessageUseCase } from "../../../application/conversation/send-message.use-case.js";
import { createGetConversationUseCase } from "../../../application/conversation/get-conversation.use-case.js";
import { createListConversationsUseCase } from "../../../application/conversation/list-conversations.use-case.js";
import { createGenerateAssistantReplyUseCase } from "../../../application/conversation/generate-assistant-reply.use-case.js";
import { createStreamAssistantReplyUseCase } from "../../../application/conversation/stream-assistant-reply.use-case.js";
import { createRenameConversationUseCase } from "../../../application/conversation/rename-conversation.use-case.js";
import { createDeleteConversationUseCase } from "../../../application/conversation/delete-conversation.use-case.js";
import { MessageContent } from "../../../domain/conversation/value-objects/message-content.vo.js";
import { ModelNotFoundError } from "../../../domain/ai-model/errors/ai-model.errors.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../../domain/conversation/ports/ai-provider.port.js";
import { createPromptManager } from "../../../domain/prompt/prompt-manager.js";

function createFakeAIProvider(streamDeltas: string[] = ["respuesta ", "simulada"]): AIProviderPort {
  return {
    generateReply: async () => MessageContent.create("respuesta simulada"),
    async *streamReply(): AsyncIterable<AIGenerationChunk> {
      for (const delta of streamDeltas) {
        yield { type: "content", delta };
      }
    },
  };
}

function createFailingAIProvider(error: Error): AIProviderPort {
  return {
    generateReply: async () => {
      throw error;
    },
    streamReply(): AsyncIterable<AIGenerationChunk> {
      return {
        [Symbol.asyncIterator]: () => ({
          next(): Promise<IteratorResult<AIGenerationChunk>> {
            throw error;
          },
        }),
      };
    },
  };
}

function buildApp(aiProvider: AIProviderPort = createFakeAIProvider()) {
  const app = Fastify();
  const repository = new InMemoryConversationRepository();
  const promptManager = createPromptManager();

  registerConversationRoutes(app, {
    startConversation: createStartConversationUseCase(repository),
    sendMessage: createSendMessageUseCase(repository),
    getConversation: createGetConversationUseCase(repository),
    listConversations: createListConversationsUseCase(repository),
    generateAssistantReply: createGenerateAssistantReplyUseCase(
      repository,
      aiProvider,
      promptManager,
    ),
    streamAssistantReply: createStreamAssistantReplyUseCase(repository, aiProvider, promptManager),
    renameConversation: createRenameConversationUseCase(repository),
    deleteConversation: createDeleteConversationUseCase(repository),
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

  it("GET /api/v1/conversations devuelve un array vacío si no hay conversaciones", async () => {
    const app = buildApp();

    const response = await app.inject({ method: "GET", url: "/api/v1/conversations" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("GET /api/v1/conversations devuelve las conversaciones creadas", async () => {
    const app = buildApp();
    const first = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const second = await app.inject({ method: "POST", url: "/api/v1/conversations" });

    const response = await app.inject({ method: "GET", url: "/api/v1/conversations" });

    expect(response.statusCode).toBe(200);
    const ids = (response.json() as Array<{ id: string }>).map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([first.json().id, second.json().id]));
    expect(ids).toHaveLength(2);
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

  it("POST /api/v1/conversations/:id/generate/stream transmite eventos SSE de chunk y completed", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate/stream`,
      payload: { modelId: "gemini-2.5-flash" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.payload).toContain('event: chunk\ndata: {"delta":"respuesta "}');
    expect(response.payload).toContain('event: chunk\ndata: {"delta":"simulada"}');
    expect(response.payload).toContain("event: completed");
    expect(response.payload).toContain('"role":"assistant"');
    expect(response.payload).toContain('"content":"respuesta simulada"');
  });

  it("POST /api/v1/conversations/:id/generate/stream responde 400 si falta el modelId", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate/stream`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("POST /api/v1/conversations/:id/generate/stream emite un evento error si el proveedor falla", async () => {
    const app = buildApp(createFailingAIProvider(new ModelNotFoundError("no-existe")));
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/conversations/${id}/generate/stream`,
      payload: { modelId: "gemini-2.5-flash" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toContain("event: error");
    expect(response.payload).toContain('"code":"AI_MODEL.NOT_FOUND"');
  });

  it("PATCH /api/v1/conversations/:id renombra la conversación", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/conversations/${id}`,
      payload: { title: "Mi conversación" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id, title: "Mi conversación" });
  });

  it("PATCH /api/v1/conversations/:id responde 400 si falta el title", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/conversations/${id}`,
      payload: {},
    });

    expect(response.statusCode).toBe(400);
  });

  it("PATCH /api/v1/conversations/:id responde 400 si el title está vacío", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({
      method: "PATCH",
      url: `/api/v1/conversations/${id}`,
      payload: { title: "   " },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ code: "CONVERSATION.EMPTY_TITLE" });
  });

  it("PATCH /api/v1/conversations/:id responde 404 si la conversación no existe", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/conversations/no-existe",
      payload: { title: "Nuevo título" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("DELETE /api/v1/conversations/:id elimina la conversación", async () => {
    const app = buildApp();
    const started = await app.inject({ method: "POST", url: "/api/v1/conversations" });
    const { id } = started.json();

    const response = await app.inject({ method: "DELETE", url: `/api/v1/conversations/${id}` });
    expect(response.statusCode).toBe(204);

    const getResponse = await app.inject({ method: "GET", url: `/api/v1/conversations/${id}` });
    expect(getResponse.statusCode).toBe(404);
  });

  it("DELETE /api/v1/conversations/:id responde 404 si la conversación no existe", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/conversations/no-existe",
    });

    expect(response.statusCode).toBe(404);
  });
});

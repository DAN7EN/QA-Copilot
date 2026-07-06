import type { FastifyInstance, FastifyReply } from "fastify";
import { DomainError } from "../../../domain/shared/errors/domain-error.js";
import type { StartConversationUseCase } from "../../../application/conversation/start-conversation.use-case.js";
import type { SendMessageUseCase } from "../../../application/conversation/send-message.use-case.js";
import type { GetConversationUseCase } from "../../../application/conversation/get-conversation.use-case.js";
import type { GenerateAssistantReplyUseCase } from "../../../application/conversation/generate-assistant-reply.use-case.js";
import { toDomainErrorResponse } from "../shared/domain-error-response.js";
import { toConversationDto } from "./conversation.mapper.js";

export type ConversationRouteDependencies = {
  startConversation: StartConversationUseCase;
  sendMessage: SendMessageUseCase;
  getConversation: GetConversationUseCase;
  generateAssistantReply: GenerateAssistantReplyUseCase;
};

function handleDomainError(error: unknown, reply: FastifyReply): { code: string; message: string } {
  if (!(error instanceof DomainError)) {
    throw error;
  }

  const { statusCode, body } = toDomainErrorResponse(error);
  reply.code(statusCode);
  return body;
}

function extractMessageContent(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { content } = body as Record<string, unknown>;
  return typeof content === "string" ? content : null;
}

function extractModelId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { modelId } = body as Record<string, unknown>;
  return typeof modelId === "string" ? modelId : null;
}

export function registerConversationRoutes(
  app: FastifyInstance,
  deps: ConversationRouteDependencies,
): void {
  app.post("/api/v1/conversations", async (_request, reply) => {
    const conversation = await deps.startConversation.execute();
    reply.code(201);
    return toConversationDto(conversation);
  });

  app.get("/api/v1/conversations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const conversation = await deps.getConversation.execute({ conversationId: id });
      return toConversationDto(conversation);
    } catch (error) {
      return handleDomainError(error, reply);
    }
  });

  app.post("/api/v1/conversations/:id/messages", async (request, reply) => {
    const { id } = request.params as { id: string };
    const content = extractMessageContent(request.body);

    if (content === null) {
      reply.code(400);
      return {
        code: "HTTP.INVALID_BODY",
        message: 'El campo "content" es obligatorio y debe ser un string.',
      };
    }

    try {
      const conversation = await deps.sendMessage.execute({ conversationId: id, content });
      reply.code(201);
      return toConversationDto(conversation);
    } catch (error) {
      return handleDomainError(error, reply);
    }
  });

  app.post("/api/v1/conversations/:id/generate", async (request, reply) => {
    const { id } = request.params as { id: string };
    const modelId = extractModelId(request.body);

    if (modelId === null) {
      reply.code(400);
      return {
        code: "HTTP.INVALID_BODY",
        message: 'El campo "modelId" es obligatorio y debe ser un string.',
      };
    }

    // Si el cliente cierra la conexión mientras se espera la respuesta de la
    // IA, se cancela la llamada al proveedor en curso (ver AIProviderPort).
    const abortController = new AbortController();
    const onClientDisconnect = (): void => {
      if (!reply.raw.writableEnded) {
        abortController.abort();
      }
    };
    reply.raw.on("close", onClientDisconnect);

    try {
      const conversation = await deps.generateAssistantReply.execute({
        conversationId: id,
        modelId,
        signal: abortController.signal,
      });
      reply.code(201);
      return toConversationDto(conversation);
    } catch (error) {
      return handleDomainError(error, reply);
    } finally {
      reply.raw.off("close", onClientDisconnect);
    }
  });
}

import type { FastifyInstance } from "fastify";
import { DomainError } from "../../../domain/shared/errors/domain-error.js";
import type { StartConversationUseCase } from "../../../application/conversation/start-conversation.use-case.js";
import type { SendMessageUseCase } from "../../../application/conversation/send-message.use-case.js";
import type { GetConversationUseCase } from "../../../application/conversation/get-conversation.use-case.js";
import type { ListConversationsUseCase } from "../../../application/conversation/list-conversations.use-case.js";
import type { GenerateAssistantReplyUseCase } from "../../../application/conversation/generate-assistant-reply.use-case.js";
import type { StreamAssistantReplyUseCase } from "../../../application/conversation/stream-assistant-reply.use-case.js";
import type { RenameConversationUseCase } from "../../../application/conversation/rename-conversation.use-case.js";
import type { DeleteConversationUseCase } from "../../../application/conversation/delete-conversation.use-case.js";
import { AIProviderCancelledError } from "../../../domain/ai-model/errors/ai-model.errors.js";
import { toDomainErrorResponse } from "../shared/domain-error-response.js";
import { handleDomainError } from "../shared/handle-domain-error.js";
import { onClientDisconnect } from "../shared/client-disconnect.js";
import { endSseStream, startSseStream, writeSseEvent } from "../shared/sse.js";
import { toConversationDto, toMessageDto } from "./conversation.mapper.js";

export type ConversationRouteDependencies = {
  startConversation: StartConversationUseCase;
  sendMessage: SendMessageUseCase;
  getConversation: GetConversationUseCase;
  listConversations: ListConversationsUseCase;
  generateAssistantReply: GenerateAssistantReplyUseCase;
  streamAssistantReply: StreamAssistantReplyUseCase;
  renameConversation: RenameConversationUseCase;
  deleteConversation: DeleteConversationUseCase;
};

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

function extractTitle(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { title } = body as Record<string, unknown>;
  return typeof title === "string" ? title : null;
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

  app.get("/api/v1/conversations", async () => {
    const conversations = await deps.listConversations.execute();
    return conversations.map(toConversationDto);
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

  app.patch("/api/v1/conversations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const title = extractTitle(request.body);

    if (title === null) {
      reply.code(400);
      return {
        code: "HTTP.INVALID_BODY",
        message: 'El campo "title" es obligatorio y debe ser un string.',
      };
    }

    try {
      const conversation = await deps.renameConversation.execute({ conversationId: id, title });
      return toConversationDto(conversation);
    } catch (error) {
      return handleDomainError(error, reply);
    }
  });

  app.delete("/api/v1/conversations/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await deps.deleteConversation.execute({ conversationId: id });
      reply.code(204);
      return null;
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
    const removeDisconnectListener = onClientDisconnect(reply, () => abortController.abort());

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
      removeDisconnectListener();
    }
  });

  app.post("/api/v1/conversations/:id/generate/stream", async (request, reply) => {
    const { id } = request.params as { id: string };
    const modelId = extractModelId(request.body);

    if (modelId === null) {
      reply.code(400);
      return {
        code: "HTTP.INVALID_BODY",
        message: 'El campo "modelId" es obligatorio y debe ser un string.',
      };
    }

    startSseStream(reply);

    const abortController = new AbortController();
    const removeDisconnectListener = onClientDisconnect(reply, () => abortController.abort());

    try {
      for await (const event of deps.streamAssistantReply.execute({
        conversationId: id,
        modelId,
        signal: abortController.signal,
      })) {
        if (event.type === "chunk") {
          writeSseEvent(reply, "chunk", { delta: event.delta });
        } else {
          writeSseEvent(reply, "completed", toMessageDto(event.message));
        }
      }
    } catch (error) {
      if (error instanceof AIProviderCancelledError) {
        // El cliente ya cerró la conexión: no hay a quién notificar.
      } else if (error instanceof DomainError) {
        const { body } = toDomainErrorResponse(error);
        writeSseEvent(reply, "error", body);
      } else {
        request.log.error(error, "Unexpected error during SSE generation stream");
        writeSseEvent(reply, "error", {
          code: "HTTP.INTERNAL_ERROR",
          message: "Ocurrió un error inesperado al generar la respuesta.",
        });
      }
    } finally {
      removeDisconnectListener();
      endSseStream(reply);
    }
  });
}

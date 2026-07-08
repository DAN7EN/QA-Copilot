import type { FastifyInstance } from "fastify";
import type { GenerateGherkinUseCase } from "../../../application/gherkin/generate-gherkin.use-case.js";
import { handleDomainError } from "../shared/handle-domain-error.js";
import { onClientDisconnect } from "../shared/client-disconnect.js";
import { toGherkinResultDto } from "./gherkin.mapper.js";

export type GherkinRouteDependencies = {
  generateGherkin: GenerateGherkinUseCase;
};

function extractModelId(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { modelId } = body as Record<string, unknown>;
  return typeof modelId === "string" ? modelId : null;
}

export function registerGherkinRoutes(app: FastifyInstance, deps: GherkinRouteDependencies): void {
  app.post("/api/v1/conversations/:id/capabilities/gherkin", async (request, reply) => {
    const { id } = request.params as { id: string };
    const modelId = extractModelId(request.body);

    if (modelId === null) {
      reply.code(400);
      return {
        code: "HTTP.INVALID_BODY",
        message: 'El campo "modelId" es obligatorio y debe ser un string.',
      };
    }

    const abortController = new AbortController();
    const removeDisconnectListener = onClientDisconnect(reply, () => abortController.abort());

    try {
      const result = await deps.generateGherkin.execute({
        conversationId: id,
        modelId,
        signal: abortController.signal,
      });
      return toGherkinResultDto(result);
    } catch (error) {
      return handleDomainError(error, reply);
    } finally {
      removeDisconnectListener();
    }
  });
}

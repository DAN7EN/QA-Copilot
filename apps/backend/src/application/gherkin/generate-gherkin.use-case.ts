import type { ConversationRepositoryPort } from "../../domain/conversation/ports/conversation-repository.port.js";
import type { CapabilityContextBuilder } from "../../domain/capability/ports/capability-context-builder.port.js";
import type { CapabilityHandler } from "../../domain/capability/ports/capability-handler.port.js";
import { findConversationOrThrow } from "../conversation/find-conversation-or-throw.js";
import type {
  GherkinCapabilityContext,
  GherkinCapabilityInput,
} from "./gherkin-context.builder.js";
import type { GherkinResult } from "./gherkin-result.js";

export interface GenerateGherkinInput {
  conversationId: string;
  modelId: string;
  signal?: AbortSignal;
}

export interface GenerateGherkinUseCase {
  execute(input: GenerateGherkinInput): Promise<GherkinResult>;
}

/**
 * Orquesta la capacidad Gherkin: obtiene la conversación, construye el
 * contexto (Context Builder) y ejecuta el Handler, que a su vez usa
 * `AIProviderPort` y el Output Parser. A diferencia de `GenerateAssistantReplyUseCase`,
 * no agrega mensajes a la conversación ni la persiste: el resultado es un
 * `GherkinResult`, no una respuesta de chat.
 */
export function createGenerateGherkinUseCase(
  repository: ConversationRepositoryPort,
  contextBuilder: CapabilityContextBuilder<GherkinCapabilityInput, GherkinCapabilityContext>,
  handler: CapabilityHandler<GherkinCapabilityContext, GherkinResult>,
): GenerateGherkinUseCase {
  return {
    async execute({
      conversationId,
      modelId,
      signal,
    }: GenerateGherkinInput): Promise<GherkinResult> {
      const conversation = await findConversationOrThrow(repository, conversationId);
      const context = contextBuilder.build({ conversation, modelId, signal });

      return handler.execute(context);
    },
  };
}

import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import type { PromptMessage } from "../../domain/prompt/value-objects/prompt-message.vo.js";
import type { PromptManager } from "../../domain/prompt/prompt-manager.js";
import type { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import type { CapabilityContextBuilder } from "../../domain/capability/ports/capability-context-builder.port.js";
import { getModelOrThrow } from "../../domain/ai-model/model-registry.js";
import { buildGherkinContext } from "./build-gherkin-context.js";

export type GherkinCapabilityInput = {
  conversation: Conversation;
  modelId: string;
  signal?: AbortSignal;
};

export type GherkinCapabilityContext = {
  messages: readonly PromptMessage[];
  modelId: ModelId;
  signal?: AbortSignal;
};

/**
 * Primera implementación real de `CapabilityContextBuilder` (Sprint 6A
 * definió el punto de extensión sin implementaciones). Resuelve el modelo vía
 * el Model Registry y arma los mensajes vía `buildGherkinContext`, que a su
 * vez reutiliza el Prompt Manager.
 */
export function createGherkinCapabilityContextBuilder(
  promptManager: PromptManager,
): CapabilityContextBuilder<GherkinCapabilityInput, GherkinCapabilityContext> {
  return {
    build({ conversation, modelId, signal }: GherkinCapabilityInput): GherkinCapabilityContext {
      const model = getModelOrThrow(modelId);
      const messages = buildGherkinContext(conversation, promptManager);

      return { messages, modelId: model.getId(), signal };
    },
  };
}

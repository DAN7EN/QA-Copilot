import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";
import type { CapabilityHandler } from "../../domain/capability/ports/capability-handler.port.js";
import type { CapabilityOutputParser } from "../../domain/capability/ports/capability-output-parser.port.js";
import type { GherkinCapabilityContext } from "./gherkin-context.builder.js";
import type { GherkinResult } from "./gherkin-result.js";

/**
 * Primera implementación real de `CapabilityHandler`. Ejecuta la llamada al
 * `AIProviderPort` con el contexto ya construido y delega la interpretación
 * de la respuesta cruda al `CapabilityOutputParser` de la capacidad.
 */
export function createGherkinCapabilityHandler(
  aiProvider: AIProviderPort,
  outputParser: CapabilityOutputParser<GherkinResult>,
): CapabilityHandler<GherkinCapabilityContext, GherkinResult> {
  return {
    async execute({ messages, modelId, signal }: GherkinCapabilityContext): Promise<GherkinResult> {
      const reply = await aiProvider.generateReply(messages, modelId, signal);
      return outputParser.parse(reply.toString());
    },
  };
}

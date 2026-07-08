import type { MessageContent } from "../value-objects/message-content.vo.js";
import type { ModelId } from "../../ai-model/value-objects/model-id.vo.js";
import type { PromptMessage } from "../../prompt/value-objects/prompt-message.vo.js";

/**
 * Un fragmento incremental de una generación en curso. `type` distingue la
 * naturaleza del fragmento; hoy solo existe "content", pero el discriminante
 * deja el contrato listo para capacidades futuras (streaming de razonamiento,
 * tool calling) sin romper a los consumidores existentes.
 */
export type AIGenerationChunk = {
  type: "content";
  delta: string;
};

/**
 * Contrato para el proveedor de IA. Recibe la colección final de mensajes
 * (Prompt Management Framework, Sprint 5) ya resuelta —System Prompt, historial
 * y mensaje actual— y un ModelId propio del Model Registry: nunca construye
 * prompts, ni conoce Conversation, URLs, API keys o identificadores internos
 * del proveedor de infraestructura. Esa construcción es responsabilidad del
 * Prompt Manager y del caso de uso, no del adaptador.
 *
 * `signal` es opcional y permite propagar la cancelación del cliente HTTP
 * hasta el adaptador; es un tipo estándar de la plataforma (no un detalle de
 * infraestructura propietario), por lo que no compromete el puerto.
 */
export interface AIProviderPort {
  generateReply(
    messages: readonly PromptMessage[],
    modelId: ModelId,
    signal?: AbortSignal,
  ): Promise<MessageContent>;

  /**
   * Igual que `generateReply`, pero entrega la respuesta incrementalmente.
   * Una conversación (el agregado persistente) puede tener múltiples
   * generaciones: este método representa una generación individual, no la
   * conversación en sí.
   */
  streamReply(
    messages: readonly PromptMessage[],
    modelId: ModelId,
    signal?: AbortSignal,
  ): AsyncIterable<AIGenerationChunk>;
}

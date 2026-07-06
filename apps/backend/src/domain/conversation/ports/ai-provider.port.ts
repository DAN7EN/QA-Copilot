import type { Conversation } from "../entities/conversation.entity.js";
import type { MessageContent } from "../value-objects/message-content.vo.js";
import type { ModelId } from "../../ai-model/value-objects/model-id.vo.js";

/**
 * Contrato para el proveedor de IA. El dominio solo conoce el historial de la
 * conversación y un ModelId propio del Model Registry: nunca URLs, API keys ni
 * identificadores internos del proveedor de infraestructura.
 *
 * `signal` es opcional y permite propagar la cancelación del cliente HTTP
 * hasta el adaptador; es un tipo estándar de la plataforma (no un detalle de
 * infraestructura propietario), por lo que no compromete el puerto.
 */
export interface AIProviderPort {
  generateReply(
    conversation: Conversation,
    modelId: ModelId,
    signal?: AbortSignal,
  ): Promise<MessageContent>;
}

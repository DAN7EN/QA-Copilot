import { AIModel } from "./value-objects/ai-model.vo.js";
import { ModelId } from "./value-objects/model-id.vo.js";
import { ModelNotFoundError } from "./errors/ai-model.errors.js";

/**
 * Catálogo de modelos soportados por el Conversation Core.
 *
 * Única fuente de verdad: agregar un modelo nuevo significa añadir una entrada
 * aquí, sin modificar entidades, casos de uso ni el frontend. Los ids usados
 * son propios del dominio; el mapeo hacia los identificadores internos del
 * proveedor (Cloudflare AI Gateway) vive únicamente en su adaptador.
 */
const MODELS: readonly AIModel[] = [
  new AIModel(ModelId.fromString("gemini-2.5-flash"), "Gemini 2.5 Flash", "Google", [
    "chat",
    "gherkin",
  ]),
  new AIModel(ModelId.fromString("mistral-small"), "Mistral Small", "Mistral AI", [
    "chat",
    "gherkin",
  ]),
  new AIModel(ModelId.fromString("llama-3.3-70b"), "Llama 3.3 70B", "Meta", ["chat", "gherkin"]),
  new AIModel(ModelId.fromString("deepseek-v3"), "DeepSeek V3", "DeepSeek", ["chat", "gherkin"]),
];

export function listModels(): readonly AIModel[] {
  return MODELS;
}

export function findModelById(id: string): AIModel | null {
  return MODELS.find((model) => model.getId().toString() === id) ?? null;
}

export function getModelOrThrow(id: string): AIModel {
  const model = findModelById(id);

  if (!model) {
    throw new ModelNotFoundError(id);
  }

  return model;
}

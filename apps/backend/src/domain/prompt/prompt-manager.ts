import type { PromptDefinition } from "./value-objects/prompt-definition.vo.js";
import { findPromptDefinition } from "./prompt-registry.js";
import { renderPromptTemplate } from "./prompt-renderer.js";

export type RenderPromptInput = {
  id: string;
  version?: string;
  variables?: Readonly<Record<string, string>>;
};

/**
 * Único punto de entrada para obtener un prompt. Ningún otro componente
 * (casos de uso, adaptadores) debe conocer templates, versiones ni el
 * Registry directamente: todos pasan por `render`.
 */
export interface PromptManager {
  render(input: RenderPromptInput): string;
}

export function createPromptManager(
  resolveDefinition: (id: string, version?: string) => PromptDefinition = findPromptDefinition,
): PromptManager {
  return {
    render({ id, version, variables = {} }: RenderPromptInput): string {
      const definition = resolveDefinition(id, version);
      return renderPromptTemplate(definition.id, definition.template, variables);
    },
  };
}

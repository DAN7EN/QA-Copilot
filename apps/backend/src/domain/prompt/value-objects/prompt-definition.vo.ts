/**
 * Definición estática de un prompt. `variables` documenta qué nombres soporta
 * el template (autodescriptivo para quien lo registre); el Renderer valida en
 * tiempo de render cuáles de esos placeholders realmente faltan.
 */
export type PromptDefinition = {
  id: string;
  name: string;
  version: string;
  description: string;
  purpose: string;
  template: string;
  variables: readonly string[];
};

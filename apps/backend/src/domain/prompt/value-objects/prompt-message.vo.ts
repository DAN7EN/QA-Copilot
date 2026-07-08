/**
 * Un mensaje ya resuelto, listo para enviarse a un proveedor de IA. `role` es
 * un string genérico (no el `MessageRole` de `conversation`) a propósito: el
 * framework de prompts debe poder usarse desde cualquier capacidad futura
 * (Gherkin, Test Cases, etc.), no solo desde el chat conversacional.
 */
export type PromptMessage = {
  role: string;
  content: string;
};

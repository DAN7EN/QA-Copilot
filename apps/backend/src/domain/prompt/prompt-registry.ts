import type { PromptDefinition } from "./value-objects/prompt-definition.vo.js";
import { PromptNotFoundError } from "./errors/prompt.errors.js";

/**
 * Catálogo de prompts. Única fuente de verdad, igual que el Model Registry
 * (Sprint 3): agregar un prompt nuevo (Gherkin, Test Cases, Playwright, ...)
 * es añadir una entrada aquí, sin tocar el Prompt Manager ni los casos de uso
 * que lo consumen.
 */
const PROMPT_DEFINITIONS: readonly PromptDefinition[] = [
  {
    id: "chat.system",
    name: "Chat – System Prompt",
    version: "1.0.0",
    description: "Instrucciones base para el asistente conversacional de QA Copilot.",
    purpose: "Definir el rol, el tono y el enfoque de QA del asistente en la capacidad de Chat.",
    template:
      "Eres QA Copilot, un asistente conversacional especializado en Quality Assurance. " +
      "Ayudas a equipos de QA con preguntas y tareas relacionadas con testing. " +
      "Responde de forma clara, precisa y profesional.",
    variables: [],
  },
  {
    id: "gherkin.system",
    name: "Gherkin Generator – System Prompt",
    version: "1.0.0",
    description: "Instrucciones base para la capacidad de generación de escenarios Gherkin.",
    purpose:
      "Especializar al modelo como experto en BDD para generar Gherkin a partir de requisitos.",
    template:
      "Eres un Senior QA Engineer, experto en BDD (Behavior-Driven Development), especialista en " +
      "criterios de aceptación y experto en Gherkin. A partir del requisito o historia de usuario " +
      "que te compartan, generás escenarios Gherkin de alta calidad (Feature, Background cuando " +
      "corresponda, y uno o más Scenario con pasos Given/When/Then). " +
      "No inventes requisitos que no te hayan dado. No expliques tu razonamiento. No converses. " +
      "Respondé únicamente con Gherkin en markdown válido, sin texto adicional antes o después.",
    variables: [],
  },
];

export function listPrompts(): readonly PromptDefinition[] {
  return PROMPT_DEFINITIONS;
}

export function findPromptDefinition(id: string, version?: string): PromptDefinition {
  const matches = PROMPT_DEFINITIONS.filter(
    (prompt) => prompt.id === id && (version === undefined || prompt.version === version),
  );

  if (matches.length !== 1) {
    throw new PromptNotFoundError(id, version);
  }

  return matches[0];
}

import type { Capability } from "./value-objects/capability.vo.js";
import { CapabilityNotFoundError } from "./errors/capability.errors.js";

/**
 * Catálogo de capacidades del sistema. Mismo patrón que el Model Registry
 * (Sprint 3) y el Prompt Registry (Sprint 5): un array estático como única
 * fuente de verdad. Agregar una capacidad nueva (Gherkin, Test Cases, ...) es
 * añadir una entrada aquí, sin tocar el resto del framework.
 *
 * Sprint 8 agrega "gherkin"; las demás llegarán en sprints futuros.
 */
const CAPABILITIES: readonly Capability[] = [
  {
    id: "chat",
    name: "Chat",
    description: "Conversación general con el asistente de QA Copilot.",
  },
  {
    id: "gherkin",
    name: "Gherkin Generator",
    description: "Generate high quality Gherkin scenarios from software requirements.",
  },
];

export function listCapabilities(): readonly Capability[] {
  return CAPABILITIES;
}

export function findCapabilityById(id: string): Capability | null {
  return CAPABILITIES.find((capability) => capability.id === id) ?? null;
}

export function getCapabilityOrThrow(id: string): Capability {
  const capability = findCapabilityById(id);

  if (!capability) {
    throw new CapabilityNotFoundError(id);
  }

  return capability;
}

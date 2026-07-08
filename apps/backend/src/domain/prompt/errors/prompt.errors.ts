import { DomainError } from "../../shared/errors/domain-error.js";

/**
 * Ambos errores reflejan fallas de configuración interna (un prompt mal
 * registrado o una llamada que olvidó pasar una variable): nunca se originan
 * en un input del usuario, por lo que no exponen detalles internos más allá
 * del id/variables involucrados.
 */
export class PromptNotFoundError extends DomainError {
  readonly code = "PROMPT.NOT_FOUND";

  constructor(id: string, version?: string) {
    super(
      version
        ? `No se encontró el prompt "${id}" en la versión "${version}".`
        : `No se encontró el prompt "${id}".`,
    );
  }
}

export class MissingPromptVariablesError extends DomainError {
  readonly code = "PROMPT.MISSING_VARIABLES";

  constructor(promptId: string, missingVariables: readonly string[]) {
    super(
      `Faltan variables requeridas para renderizar el prompt "${promptId}": ${missingVariables.join(", ")}.`,
    );
  }
}

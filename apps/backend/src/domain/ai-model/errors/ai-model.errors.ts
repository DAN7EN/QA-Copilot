import { DomainError } from "../../shared/errors/domain-error.js";

export class InvalidModelIdError extends DomainError {
  readonly code = "AI_MODEL.INVALID_MODEL_ID";

  constructor() {
    super("El identificador del modelo no puede estar vacío.");
  }
}

export class ModelNotFoundError extends DomainError {
  readonly code = "AI_MODEL.NOT_FOUND";

  constructor(modelId: string) {
    super(`No se encontró el modelo con id "${modelId}".`);
  }
}

/**
 * Errores del proveedor de IA, normalizados por el adaptador correspondiente.
 * Ninguno de estos mensajes expone detalles internos del proveedor (cuerpos de
 * respuesta, API keys, prompts): son mensajes fijos y seguros para el cliente.
 */
export class AIProviderConfigurationError extends DomainError {
  readonly code = "AI_PROVIDER.INVALID_CONFIGURATION";

  constructor() {
    super("El proveedor de IA no está configurado correctamente.");
  }
}

export class AIProviderTimeoutError extends DomainError {
  readonly code = "AI_PROVIDER.TIMEOUT";

  constructor() {
    super("El proveedor de IA no respondió dentro del tiempo esperado.");
  }
}

export class AIProviderNetworkError extends DomainError {
  readonly code = "AI_PROVIDER.NETWORK_ERROR";

  constructor() {
    super("No fue posible contactar al proveedor de IA.");
  }
}

/**
 * El proveedor respondió, pero con un estado HTTP de error (4xx o 5xx).
 * `upstreamStatusCode` se conserva solo para logging interno, nunca se expone al cliente.
 */
export class AIProviderUpstreamError extends DomainError {
  readonly code = "AI_PROVIDER.UPSTREAM_ERROR";

  constructor(readonly upstreamStatusCode: number) {
    super("El proveedor de IA respondió con un error.");
  }
}

export class AIProviderInvalidResponseError extends DomainError {
  readonly code = "AI_PROVIDER.INVALID_RESPONSE";

  constructor() {
    super("El proveedor de IA devolvió una respuesta inválida.");
  }
}

export class AIProviderCancelledError extends DomainError {
  readonly code = "AI_PROVIDER.CANCELLED";

  constructor() {
    super("La solicitud al proveedor de IA fue cancelada.");
  }
}

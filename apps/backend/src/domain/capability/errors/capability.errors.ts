import { DomainError } from "../../shared/errors/domain-error.js";

export class CapabilityNotFoundError extends DomainError {
  readonly code = "CAPABILITY.NOT_FOUND";

  constructor(id: string) {
    super(`No se encontró la capacidad "${id}".`);
  }
}

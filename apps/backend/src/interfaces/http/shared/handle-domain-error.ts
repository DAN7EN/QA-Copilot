import type { FastifyReply } from "fastify";
import { DomainError } from "../../../domain/shared/errors/domain-error.js";
import { toDomainErrorResponse } from "./domain-error-response.js";

/** Traduce un `DomainError` a una respuesta HTTP; relanza cualquier otro error. */
export function handleDomainError(
  error: unknown,
  reply: FastifyReply,
): { code: string; message: string } {
  if (!(error instanceof DomainError)) {
    throw error;
  }

  const { statusCode, body } = toDomainErrorResponse(error);
  reply.code(statusCode);
  return body;
}

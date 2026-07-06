import type { DomainError } from "../../../domain/shared/errors/domain-error.js";

export type DomainErrorResponse = {
  statusCode: number;
  body: { code: string; message: string };
};

const STATUS_CODE_BY_ERROR_CODE: Record<string, number> = {
  "CONVERSATION.NOT_FOUND": 404,
  "AI_MODEL.NOT_FOUND": 404,
  "AI_PROVIDER.INVALID_CONFIGURATION": 500,
  "AI_PROVIDER.TIMEOUT": 504,
  "AI_PROVIDER.NETWORK_ERROR": 502,
  "AI_PROVIDER.UPSTREAM_ERROR": 502,
  "AI_PROVIDER.INVALID_RESPONSE": 502,
  "AI_PROVIDER.CANCELLED": 499,
};

export function toDomainErrorResponse(error: DomainError): DomainErrorResponse {
  const statusCode = STATUS_CODE_BY_ERROR_CODE[error.code] ?? 400;

  return {
    statusCode,
    body: { code: error.code, message: error.message },
  };
}

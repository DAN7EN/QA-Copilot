import { DomainError } from "../../shared/errors/domain-error.js";

export class InvalidConversationIdError extends DomainError {
  readonly code = "CONVERSATION.INVALID_CONVERSATION_ID";

  constructor() {
    super("El identificador de la conversación no puede estar vacío.");
  }
}

export class ConversationNotFoundError extends DomainError {
  readonly code = "CONVERSATION.NOT_FOUND";

  constructor(conversationId: string) {
    super(`No se encontró la conversación con id "${conversationId}".`);
  }
}

export class EmptyConversationTitleError extends DomainError {
  readonly code = "CONVERSATION.EMPTY_TITLE";

  constructor() {
    super("El título de la conversación no puede estar vacío.");
  }
}

export class EmptyMessageContentError extends DomainError {
  readonly code = "CONVERSATION.EMPTY_MESSAGE_CONTENT";

  constructor() {
    super("El contenido del mensaje no puede estar vacío.");
  }
}

export class MessageContentTooLongError extends DomainError {
  readonly code = "CONVERSATION.MESSAGE_CONTENT_TOO_LONG";

  constructor(maxLength: number) {
    super(`El contenido del mensaje no puede superar los ${maxLength} caracteres.`);
  }
}

export class InvalidMessageRoleError extends DomainError {
  readonly code = "CONVERSATION.INVALID_MESSAGE_ROLE";

  constructor(role: string) {
    super(`"${role}" no es un rol de mensaje válido.`);
  }
}

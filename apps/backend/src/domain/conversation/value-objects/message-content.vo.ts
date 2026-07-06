import {
  EmptyMessageContentError,
  MessageContentTooLongError,
} from "../errors/conversation.errors.js";

export const MAX_MESSAGE_CONTENT_LENGTH = 8000;

export class MessageContent {
  private constructor(private readonly value: string) {}

  static create(rawValue: string): MessageContent {
    const trimmed = rawValue.trim();

    if (trimmed.length === 0) {
      throw new EmptyMessageContentError();
    }

    if (trimmed.length > MAX_MESSAGE_CONTENT_LENGTH) {
      throw new MessageContentTooLongError(MAX_MESSAGE_CONTENT_LENGTH);
    }

    return new MessageContent(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageContent): boolean {
    return this.value === other.value;
  }
}

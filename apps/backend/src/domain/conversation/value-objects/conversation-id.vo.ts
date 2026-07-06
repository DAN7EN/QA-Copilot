import { InvalidConversationIdError } from "../errors/conversation.errors.js";

export class ConversationId {
  private constructor(private readonly value: string) {}

  static generate(): ConversationId {
    return new ConversationId(crypto.randomUUID());
  }

  static fromString(value: string): ConversationId {
    if (value.trim().length === 0) {
      throw new InvalidConversationIdError();
    }

    return new ConversationId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ConversationId): boolean {
    return this.value === other.value;
  }
}

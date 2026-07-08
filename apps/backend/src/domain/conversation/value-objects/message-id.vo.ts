export class MessageId {
  private constructor(private readonly value: string) {}

  static generate(): MessageId {
    return new MessageId(crypto.randomUUID());
  }

  /** Reconstruye un id ya existente (por ejemplo, al leerlo desde persistencia). */
  static fromString(value: string): MessageId {
    return new MessageId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }
}

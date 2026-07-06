export class MessageId {
  private constructor(private readonly value: string) {}

  static generate(): MessageId {
    return new MessageId(crypto.randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageId): boolean {
    return this.value === other.value;
  }
}

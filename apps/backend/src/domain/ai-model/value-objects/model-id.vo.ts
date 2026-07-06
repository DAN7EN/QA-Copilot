import { InvalidModelIdError } from "../errors/ai-model.errors.js";

export class ModelId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ModelId {
    if (value.trim().length === 0) {
      throw new InvalidModelIdError();
    }

    return new ModelId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ModelId): boolean {
    return this.value === other.value;
  }
}

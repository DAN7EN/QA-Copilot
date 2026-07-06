import { describe, expect, it } from "vitest";
import { ConversationId } from "./conversation-id.vo.js";
import { InvalidConversationIdError } from "../errors/conversation.errors.js";

describe("ConversationId", () => {
  it("genera identificadores únicos", () => {
    const first = ConversationId.generate();
    const second = ConversationId.generate();

    expect(first.equals(second)).toBe(false);
  });

  it("reconstruye un identificador a partir de un string y preserva su valor", () => {
    const id = ConversationId.fromString("conv-123");

    expect(id.toString()).toBe("conv-123");
  });

  it("dos identificadores con el mismo valor son iguales", () => {
    const first = ConversationId.fromString("conv-123");
    const second = ConversationId.fromString("conv-123");

    expect(first.equals(second)).toBe(true);
  });

  it("rechaza un identificador vacío", () => {
    expect(() => ConversationId.fromString("   ")).toThrow(InvalidConversationIdError);
  });
});

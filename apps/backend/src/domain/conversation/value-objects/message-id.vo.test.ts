import { describe, expect, it } from "vitest";
import { MessageId } from "./message-id.vo.js";

describe("MessageId", () => {
  it("genera identificadores únicos", () => {
    const first = MessageId.generate();
    const second = MessageId.generate();

    expect(first.equals(second)).toBe(false);
  });

  it("es igual a sí mismo", () => {
    const id = MessageId.generate();

    expect(id.equals(id)).toBe(true);
  });
});

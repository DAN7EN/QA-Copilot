import { describe, expect, it } from "vitest";
import { Message } from "./message.entity.js";
import { MessageId } from "../value-objects/message-id.vo.js";

describe("Message", () => {
  it("crea un mensaje con id, rol, contenido y fecha de creación", () => {
    const message = Message.create("user", "hola");

    expect(message.getRole()).toBe("user");
    expect(message.getContent().toString()).toBe("hola");
    expect(message.getId()).toBeDefined();
    expect(message.getCreatedAt()).toBeInstanceOf(Date);
  });

  it("genera ids distintos para mensajes distintos", () => {
    const first = Message.create("user", "hola");
    const second = Message.create("user", "hola");

    expect(first.getId().equals(second.getId())).toBe(false);
  });

  it("reconstituye un mensaje preservando id y fecha originales", () => {
    const id = MessageId.fromString("11111111-1111-1111-1111-111111111111");
    const createdAt = new Date("2024-01-01T00:00:00.000Z");

    const message = Message.reconstitute(id, "assistant", "hola de nuevo", createdAt);

    expect(message.getId().equals(id)).toBe(true);
    expect(message.getRole()).toBe("assistant");
    expect(message.getContent().toString()).toBe("hola de nuevo");
    expect(message.getCreatedAt()).toEqual(createdAt);
  });
});

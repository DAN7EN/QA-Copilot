import { describe, expect, it } from "vitest";
import { Message } from "./message.entity.js";

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
});

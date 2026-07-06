import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_CONTENT_LENGTH, MessageContent } from "./message-content.vo.js";
import {
  EmptyMessageContentError,
  MessageContentTooLongError,
} from "../errors/conversation.errors.js";

describe("MessageContent", () => {
  it("recorta espacios en blanco alrededor del contenido", () => {
    const content = MessageContent.create("  hola mundo  ");

    expect(content.toString()).toBe("hola mundo");
  });

  it("rechaza contenido vacío", () => {
    expect(() => MessageContent.create("   ")).toThrow(EmptyMessageContentError);
  });

  it("rechaza contenido que supera la longitud máxima", () => {
    const tooLong = "a".repeat(MAX_MESSAGE_CONTENT_LENGTH + 1);

    expect(() => MessageContent.create(tooLong)).toThrow(MessageContentTooLongError);
  });

  it("acepta contenido igual a la longitud máxima", () => {
    const maxLength = "a".repeat(MAX_MESSAGE_CONTENT_LENGTH);

    expect(() => MessageContent.create(maxLength)).not.toThrow();
  });
});

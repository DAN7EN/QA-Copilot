import { describe, expect, it } from "vitest";
import { Conversation } from "./conversation.entity.js";
import { Message } from "./message.entity.js";
import { ConversationId } from "../value-objects/conversation-id.vo.js";
import {
  EmptyConversationTitleError,
  EmptyMessageContentError,
  InvalidMessageRoleError,
} from "../errors/conversation.errors.js";

describe("Conversation", () => {
  it("comienza vacía con id y timestamps", () => {
    const conversation = Conversation.start();

    expect(conversation.getMessages()).toHaveLength(0);
    expect(conversation.getCreatedAt()).toEqual(conversation.getUpdatedAt());
  });

  it("agrega un mensaje y lo mantiene en orden de inserción", () => {
    const conversation = Conversation.start();

    conversation.addMessage("user", "primero");
    conversation.addMessage("user", "segundo");

    const contents = conversation.getMessages().map((message) => message.getContent().toString());
    expect(contents).toEqual(["primero", "segundo"]);
  });

  it("actualiza updatedAt al agregar un mensaje", () => {
    const conversation = Conversation.start();
    const createdAt = conversation.getCreatedAt();

    conversation.addMessage("user", "hola");

    expect(conversation.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
  });

  it("no permite mutar la lista de mensajes desde fuera", () => {
    const conversation = Conversation.start();
    conversation.addMessage("user", "hola");

    const messages = conversation.getMessages() as unknown[];
    messages.push("intruso");

    expect(conversation.getMessages()).toHaveLength(1);
  });

  it("propaga los errores de validación del mensaje", () => {
    const conversation = Conversation.start();

    expect(() => conversation.addMessage("user", "   ")).toThrow(EmptyMessageContentError);
    expect(() => conversation.addMessage("moderator", "hola")).toThrow(InvalidMessageRoleError);
  });

  it("reconstituye una conversación preservando id, fechas y mensajes originales", () => {
    const id = ConversationId.generate();
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const updatedAt = new Date("2024-01-02T00:00:00.000Z");
    const message = Message.create("user", "hola");

    const conversation = Conversation.reconstitute(id, createdAt, updatedAt, [message]);

    expect(conversation.getId().equals(id)).toBe(true);
    expect(conversation.getCreatedAt()).toEqual(createdAt);
    expect(conversation.getUpdatedAt()).toEqual(updatedAt);
    expect(conversation.getMessages()).toEqual([message]);
  });

  it("no tiene título por default y reconstituye el título original", () => {
    const conversation = Conversation.start();
    expect(conversation.getTitle()).toBeNull();

    const reconstituted = Conversation.reconstitute(
      ConversationId.generate(),
      new Date(),
      new Date(),
      [],
      "Título guardado",
    );
    expect(reconstituted.getTitle()).toBe("Título guardado");
  });

  it("rename actualiza el título recortando espacios y actualiza updatedAt", () => {
    const conversation = Conversation.start();
    const createdAt = conversation.getCreatedAt();

    conversation.rename("  Mi conversación  ");

    expect(conversation.getTitle()).toBe("Mi conversación");
    expect(conversation.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
  });

  it("rename rechaza títulos vacíos", () => {
    const conversation = Conversation.start();

    expect(() => conversation.rename("   ")).toThrow(EmptyConversationTitleError);
  });
});

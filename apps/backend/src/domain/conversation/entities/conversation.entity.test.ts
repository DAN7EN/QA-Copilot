import { describe, expect, it } from "vitest";
import { Conversation } from "./conversation.entity.js";
import {
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
});

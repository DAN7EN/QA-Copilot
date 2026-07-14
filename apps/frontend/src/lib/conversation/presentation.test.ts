import { describe, expect, it } from "vitest";
import type { ConversationDto } from "@qa-copilot/shared";
import { deriveConversationTitle, formatRelativeTime } from "./presentation";

function buildConversation(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: "conv-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    title: null,
    messages: [],
    ...overrides,
  };
}

describe("deriveConversationTitle", () => {
  it("usa un título por defecto cuando no hay mensajes de usuario ni título", () => {
    expect(deriveConversationTitle(buildConversation())).toBe("Nueva conversación");
  });

  it("prioriza el título renombrado por el usuario sobre el derivado", () => {
    const conversation = buildConversation({
      title: "Mi conversación",
      messages: [
        { id: "m1", role: "user", content: "hola", createdAt: "2026-01-01T00:00:00.000Z" },
      ],
    });

    expect(deriveConversationTitle(conversation)).toBe("Mi conversación");
  });

  it("deriva el título del primer mensaje de usuario", () => {
    const conversation = buildConversation({
      messages: [
        {
          id: "m1",
          role: "user",
          content: "  ¿Cómo genero un Gherkin?  ",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "m2",
          role: "assistant",
          content: "Respuesta",
          createdAt: "2026-01-01T00:00:01.000Z",
        },
      ],
    });

    expect(deriveConversationTitle(conversation)).toBe("¿Cómo genero un Gherkin?");
  });

  it("trunca títulos largos", () => {
    const longContent = "a".repeat(80);
    const conversation = buildConversation({
      messages: [
        { id: "m1", role: "user", content: longContent, createdAt: "2026-01-01T00:00:00.000Z" },
      ],
    });

    const title = deriveConversationTitle(conversation);
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThan(longContent.length);
  });
});

describe("formatRelativeTime", () => {
  it("formatea fechas pasadas en español", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    expect(formatRelativeTime(oneHourAgo)).toMatch(/hace/);
  });
});

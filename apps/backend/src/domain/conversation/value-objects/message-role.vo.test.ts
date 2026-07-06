import { describe, expect, it } from "vitest";
import { createMessageRole, isMessageRole } from "./message-role.vo.js";
import { InvalidMessageRoleError } from "../errors/conversation.errors.js";

describe("MessageRole", () => {
  it.each(["user", "assistant", "system"])('acepta el rol válido "%s"', (role) => {
    expect(createMessageRole(role)).toBe(role);
  });

  it("rechaza un rol desconocido", () => {
    expect(() => createMessageRole("moderator")).toThrow(InvalidMessageRoleError);
  });

  it("isMessageRole actúa como type guard", () => {
    expect(isMessageRole("user")).toBe(true);
    expect(isMessageRole("moderator")).toBe(false);
  });
});

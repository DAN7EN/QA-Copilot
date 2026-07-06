import { InvalidMessageRoleError } from "../errors/conversation.errors.js";

export const MESSAGE_ROLES = ["user", "assistant", "system"] as const;

export type MessageRole = (typeof MESSAGE_ROLES)[number];

export function createMessageRole(value: string): MessageRole {
  if (!isMessageRole(value)) {
    throw new InvalidMessageRoleError(value);
  }

  return value;
}

export function isMessageRole(value: string): value is MessageRole {
  return (MESSAGE_ROLES as readonly string[]).includes(value);
}

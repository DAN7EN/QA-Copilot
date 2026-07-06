import { MessageId } from "../value-objects/message-id.vo.js";
import { MessageContent } from "../value-objects/message-content.vo.js";
import { createMessageRole, type MessageRole } from "../value-objects/message-role.vo.js";

export class Message {
  private constructor(
    private readonly id: MessageId,
    private readonly role: MessageRole,
    private readonly content: MessageContent,
    private readonly createdAt: Date,
  ) {}

  static create(role: string, content: string): Message {
    return new Message(
      MessageId.generate(),
      createMessageRole(role),
      MessageContent.create(content),
      new Date(),
    );
  }

  getId(): MessageId {
    return this.id;
  }

  getRole(): MessageRole {
    return this.role;
  }

  getContent(): MessageContent {
    return this.content;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }
}

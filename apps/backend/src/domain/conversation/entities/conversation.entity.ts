import { ConversationId } from "../value-objects/conversation-id.vo.js";
import { Message } from "./message.entity.js";

export class Conversation {
  private readonly messages: Message[] = [];

  private constructor(
    private readonly id: ConversationId,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static start(): Conversation {
    const now = new Date();
    return new Conversation(ConversationId.generate(), now, now);
  }

  addMessage(role: string, content: string): Message {
    const message = Message.create(role, content);
    this.messages.push(message);
    this.updatedAt = new Date();
    return message;
  }

  getId(): ConversationId {
    return this.id;
  }

  getMessages(): readonly Message[] {
    return [...this.messages];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

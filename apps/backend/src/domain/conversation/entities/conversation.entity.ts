import { ConversationId } from "../value-objects/conversation-id.vo.js";
import { Message } from "./message.entity.js";
import { EmptyConversationTitleError } from "../errors/conversation.errors.js";

export class Conversation {
  private readonly messages: Message[] = [];

  private constructor(
    private readonly id: ConversationId,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private title: string | null = null,
  ) {}

  static start(): Conversation {
    const now = new Date();
    return new Conversation(ConversationId.generate(), now, now);
  }

  /**
   * Reconstruye una conversación ya existente (por ejemplo, al leerla desde
   * persistencia), preservando su identidad, fechas y mensajes originales en
   * lugar de empezar una nueva como hace `start`.
   */
  static reconstitute(
    id: ConversationId,
    createdAt: Date,
    updatedAt: Date,
    messages: readonly Message[],
    title: string | null = null,
  ): Conversation {
    const conversation = new Conversation(id, createdAt, updatedAt, title);
    conversation.messages.push(...messages);
    return conversation;
  }

  addMessage(role: string, content: string): Message {
    const message = Message.create(role, content);
    this.messages.push(message);
    this.updatedAt = new Date();
    return message;
  }

  rename(title: string): void {
    const trimmed = title.trim();

    if (trimmed.length === 0) {
      throw new EmptyConversationTitleError();
    }

    this.title = trimmed;
    this.updatedAt = new Date();
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

  getTitle(): string | null {
    return this.title;
  }
}

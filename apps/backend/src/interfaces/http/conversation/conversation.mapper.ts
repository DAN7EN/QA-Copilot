import type { ConversationDto, MessageDto } from "@qa-copilot/shared";
import type { Conversation } from "../../../domain/conversation/entities/conversation.entity.js";
import type { Message } from "../../../domain/conversation/entities/message.entity.js";

export function toMessageDto(message: Message): MessageDto {
  return {
    id: message.getId().toString(),
    role: message.getRole(),
    content: message.getContent().toString(),
    createdAt: message.getCreatedAt().toISOString(),
  };
}

export function toConversationDto(conversation: Conversation): ConversationDto {
  return {
    id: conversation.getId().toString(),
    createdAt: conversation.getCreatedAt().toISOString(),
    updatedAt: conversation.getUpdatedAt().toISOString(),
    title: conversation.getTitle(),
    messages: conversation.getMessages().map(toMessageDto),
  };
}

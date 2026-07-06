import type {
  ConversationDto,
  GenerateAssistantReplyRequest,
  SendMessageRequest,
} from "@qa-copilot/shared";
import { httpClient } from "../http/httpClient";

export const conversationApi = {
  start: (): Promise<ConversationDto> => httpClient.post<ConversationDto>("/conversations"),
  sendMessage: (conversationId: string, content: string): Promise<ConversationDto> =>
    httpClient.post<ConversationDto>(`/conversations/${conversationId}/messages`, {
      content,
    } satisfies SendMessageRequest),
  generateReply: (conversationId: string, modelId: string): Promise<ConversationDto> =>
    httpClient.post<ConversationDto>(`/conversations/${conversationId}/generate`, {
      modelId,
    } satisfies GenerateAssistantReplyRequest),
  get: (conversationId: string): Promise<ConversationDto> =>
    httpClient.get<ConversationDto>(`/conversations/${conversationId}`),
};

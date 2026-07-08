import type {
  ConversationDto,
  GenerateAssistantReplyRequest,
  MessageDto,
  SendMessageRequest,
} from "@qa-copilot/shared";
import { httpClient } from "../http/httpClient";
import { postSse } from "../http/sseClient";

export type GenerationStreamEvent =
  | { type: "chunk"; delta: string }
  | { type: "completed"; message: MessageDto }
  | { type: "error"; code: string; message: string };

async function* streamGenerateReply(
  conversationId: string,
  modelId: string,
  signal?: AbortSignal,
): AsyncGenerator<GenerationStreamEvent> {
  const events = await postSse(
    `/conversations/${conversationId}/generate/stream`,
    { modelId } satisfies GenerateAssistantReplyRequest,
    signal,
  );

  for await (const event of events) {
    if (event.event === "chunk") {
      yield { type: "chunk", ...(JSON.parse(event.data) as { delta: string }) };
    } else if (event.event === "completed") {
      yield { type: "completed", message: JSON.parse(event.data) as MessageDto };
    } else if (event.event === "error") {
      yield { type: "error", ...(JSON.parse(event.data) as { code: string; message: string }) };
    }
  }
}

export const conversationApi = {
  start: (): Promise<ConversationDto> => httpClient.post<ConversationDto>("/conversations"),
  list: (): Promise<ConversationDto[]> => httpClient.get<ConversationDto[]>("/conversations"),
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
  streamGenerateReply,
};

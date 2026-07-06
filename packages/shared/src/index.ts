/**
 * Tipos compartidos entre frontend y backend.
 *
 * Contratos de red (DTOs) expuestos por la API. No son el modelo de dominio del
 * backend: son la forma en la que ese dominio se serializa sobre HTTP.
 */

export type HealthResponse = {
  status: "ok";
  service: string;
};

export type MessageRoleDto = "user" | "assistant" | "system";

export type MessageDto = {
  id: string;
  role: MessageRoleDto;
  content: string;
  createdAt: string;
};

export type ConversationDto = {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageDto[];
};

export type SendMessageRequest = {
  content: string;
};

export type AIModelDto = {
  id: string;
  displayName: string;
  provider: string;
  capabilities: string[];
};

export type GenerateAssistantReplyRequest = {
  modelId: string;
};

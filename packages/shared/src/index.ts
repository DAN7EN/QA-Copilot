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
  title: string | null;
  messages: MessageDto[];
};

export type SendMessageRequest = {
  content: string;
};

export type RenameConversationRequest = {
  title: string;
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

export type CapabilityDto = {
  id: string;
  name: string;
  description: string;
};

export type GherkinScenarioDto = {
  title: string;
  steps: string[];
};

export type GherkinResultDto = {
  title: string;
  feature: string;
  background?: string[];
  scenarios: GherkinScenarioDto[];
  rawMarkdown: string;
};

export type GenerateGherkinRequest = {
  modelId: string;
};

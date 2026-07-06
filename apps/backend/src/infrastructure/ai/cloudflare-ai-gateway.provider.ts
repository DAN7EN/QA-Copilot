import type { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { MessageContent } from "../../domain/conversation/value-objects/message-content.vo.js";
import type { AIProviderPort } from "../../domain/conversation/ports/ai-provider.port.js";
import type { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import type { CloudflareAIGatewayConfig } from "../../shared/config/env.js";
import {
  AIProviderCancelledError,
  AIProviderConfigurationError,
  AIProviderInvalidResponseError,
  AIProviderNetworkError,
  AIProviderTimeoutError,
  AIProviderUpstreamError,
} from "../../domain/ai-model/errors/ai-model.errors.js";
import type { Logger } from "../shared/logger.js";
import type { AIMetricsRecorder } from "./ai-metrics.recorder.js";

const PROVIDER_NAME = "cloudflare-ai-gateway";

/**
 * Mapeo privado del ModelId propio del dominio hacia el identificador
 * "<provider>/<modelo>" que espera el endpoint compatible con OpenAI de
 * Cloudflare AI Gateway. Es el único lugar del sistema que conoce estos
 * identificadores internos del proveedor.
 */
const GATEWAY_MODEL_BY_ID: Record<string, string> = {
  "gemini-2.5-flash": "google-ai-studio/gemini-2.5-flash",
  "mistral-small": "mistral/mistral-small-latest",
  "llama-3.3-70b": "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "deepseek-v3": "deepseek/deepseek-chat",
};

type CompatChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function toGatewayModel(modelId: ModelId): string {
  const gatewayModel = GATEWAY_MODEL_BY_ID[modelId.toString()];

  if (!gatewayModel) {
    throw new AIProviderConfigurationError();
  }

  return gatewayModel;
}

function toChatMessages(conversation: Conversation): Array<{ role: string; content: string }> {
  return conversation.getMessages().map((message) => ({
    role: message.getRole(),
    content: message.getContent().toString(),
  }));
}

function isConfigured(config: CloudflareAIGatewayConfig): boolean {
  return Boolean(config.accountId && config.gatewayId && config.apiToken);
}

function isNamedError(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

/**
 * Combina el timeout configurado con la señal de cancelación externa (la del
 * cliente HTTP, si la hay) en una única señal para `fetch`. Al abortar,
 * conserva el `reason` original para poder distinguir después si la causa
 * fue el timeout o una cancelación externa.
 */
function createRequestAbortSignal(
  timeoutMs: number,
  externalSignal: AbortSignal | undefined,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  const onTimeout = () => controller.abort(timeoutSignal.reason);
  const onExternalAbort = () => controller.abort(externalSignal?.reason);

  timeoutSignal.addEventListener("abort", onTimeout);
  externalSignal?.addEventListener("abort", onExternalAbort);

  return {
    signal: controller.signal,
    cleanup: () => {
      timeoutSignal.removeEventListener("abort", onTimeout);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
  };
}

export function createCloudflareAIGatewayProvider(
  config: CloudflareAIGatewayConfig,
  logger: Logger,
  metrics: AIMetricsRecorder,
): AIProviderPort {
  return {
    async generateReply(
      conversation: Conversation,
      modelId: ModelId,
      externalSignal?: AbortSignal,
    ): Promise<MessageContent> {
      const model = modelId.toString();
      const startedAt = Date.now();

      function logAndRecord(outcome: "success" | "error", errorCode?: string): void {
        const durationMs = Date.now() - startedAt;
        const fields = {
          event: "ai_provider_call",
          provider: PROVIDER_NAME,
          model,
          durationMs,
          outcome,
        };

        if (outcome === "success") {
          logger.info(fields, "AI provider call succeeded");
          metrics.recordSuccess({ provider: PROVIDER_NAME, model, durationMs });
        } else {
          logger.error({ ...fields, errorCode }, "AI provider call failed");
          metrics.recordFailure({ provider: PROVIDER_NAME, model, durationMs });
        }
      }

      if (!isConfigured(config)) {
        const error = new AIProviderConfigurationError();
        logAndRecord("error", error.code);
        throw error;
      }

      let gatewayModel: string;
      try {
        gatewayModel = toGatewayModel(modelId);
      } catch (error) {
        if (error instanceof AIProviderConfigurationError) {
          logAndRecord("error", error.code);
        }
        throw error;
      }

      const url = `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`;
      const { signal, cleanup } = createRequestAbortSignal(config.timeoutMs, externalSignal);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: gatewayModel,
            messages: toChatMessages(conversation),
          }),
          signal,
        });
      } catch (error) {
        if (isNamedError(error, "TimeoutError")) {
          const timeoutError = new AIProviderTimeoutError();
          logAndRecord("error", timeoutError.code);
          throw timeoutError;
        }

        if (isNamedError(error, "AbortError")) {
          const cancelledError = new AIProviderCancelledError();
          logAndRecord("error", cancelledError.code);
          throw cancelledError;
        }

        const networkError = new AIProviderNetworkError();
        logAndRecord("error", networkError.code);
        throw networkError;
      } finally {
        cleanup();
      }

      if (!response.ok) {
        const upstreamError = new AIProviderUpstreamError(response.status);
        logAndRecord("error", upstreamError.code);
        throw upstreamError;
      }

      let payload: CompatChatCompletionResponse;
      let content: string | undefined;
      try {
        payload = (await response.json()) as CompatChatCompletionResponse;
        content = payload.choices?.[0]?.message?.content;
      } catch {
        content = undefined;
      }

      if (!content) {
        const invalidResponseError = new AIProviderInvalidResponseError();
        logAndRecord("error", invalidResponseError.code);
        throw invalidResponseError;
      }

      logAndRecord("success");
      return MessageContent.create(content);
    },
  };
}

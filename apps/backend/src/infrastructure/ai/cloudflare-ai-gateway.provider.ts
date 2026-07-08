import { MessageContent } from "../../domain/conversation/value-objects/message-content.vo.js";
import type {
  AIGenerationChunk,
  AIProviderPort,
} from "../../domain/conversation/ports/ai-provider.port.js";
import type { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import type { PromptMessage } from "../../domain/prompt/value-objects/prompt-message.vo.js";
import type { CloudflareAIGatewayConfig } from "../../shared/config/env.js";
import { DomainError } from "../../domain/shared/errors/domain-error.js";
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

type CompatChatCompletionChunk = {
  choices?: Array<{ delta?: { content?: string } }>;
};

function resolveGatewayModel(modelId: ModelId): string {
  const gatewayModel = GATEWAY_MODEL_BY_ID[modelId.toString()];

  if (!gatewayModel) {
    throw new AIProviderConfigurationError();
  }

  return gatewayModel;
}

function isConfigured(config: CloudflareAIGatewayConfig): boolean {
  return Boolean(config.accountId && config.gatewayId && config.apiToken);
}

function isNamedError(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

function buildUrl(config: CloudflareAIGatewayConfig): string {
  return `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/compat/chat/completions`;
}

/**
 * Serializa la petición al gateway. `messages` llega ya resuelto por el
 * Prompt Management Framework (Sprint 5): este adaptador no construye
 * prompts, solo transporta el resultado final.
 */
function buildRequestInit(
  config: CloudflareAIGatewayConfig,
  gatewayModel: string,
  messages: readonly PromptMessage[],
  signal: AbortSignal,
  stream: boolean,
): RequestInit {
  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: gatewayModel,
      messages,
      stream,
    }),
    signal,
  };
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

/** Normaliza cualquier error crudo (fetch, parsing) en un error de dominio consistente. */
function classifyError(error: unknown): DomainError {
  if (error instanceof DomainError) {
    return error;
  }

  if (isNamedError(error, "TimeoutError")) {
    return new AIProviderTimeoutError();
  }

  if (isNamedError(error, "AbortError")) {
    return new AIProviderCancelledError();
  }

  return new AIProviderNetworkError();
}

type Outcome = "success" | "cancelled" | "error";

/** Ciclo de vida observable de una llamada al proveedor: log estructurado + métricas. */
function createCallLifecycle(logger: Logger, metrics: AIMetricsRecorder, model: string) {
  const startedAt = Date.now();

  return {
    logStart(): void {
      logger.info(
        { event: "ai_provider_call", provider: PROVIDER_NAME, model, outcome: "start" },
        "AI provider call started",
      );
    },
    finish(outcome: Outcome, errorCode?: string): void {
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
      } else if (outcome === "cancelled") {
        logger.warn(fields, "AI provider call cancelled");
        metrics.recordCancelled({ provider: PROVIDER_NAME, model, durationMs });
      } else {
        logger.error({ ...fields, errorCode }, "AI provider call failed");
        metrics.recordFailure({ provider: PROVIDER_NAME, model, durationMs });
      }
    },
    /** Clasifica el error, registra el desenlace correspondiente y lo devuelve para relanzarlo. */
    fail(error: unknown): DomainError {
      const domainError = classifyError(error);
      const outcome: Outcome =
        domainError instanceof AIProviderCancelledError ? "cancelled" : "error";
      this.finish(outcome, domainError.code);
      return domainError;
    },
  };
}

/** Lee el cuerpo `text/event-stream` del endpoint compat y entrega los deltas de contenido. */
async function* readContentDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
        if (!dataLine) {
          continue;
        }

        const data = dataLine.slice("data:".length).trim();
        if (data === "[DONE]") {
          return;
        }

        let parsed: CompatChatCompletionChunk;
        try {
          parsed = JSON.parse(data) as CompatChatCompletionChunk;
        } catch {
          throw new AIProviderInvalidResponseError();
        }

        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function createCloudflareAIGatewayProvider(
  config: CloudflareAIGatewayConfig,
  logger: Logger,
  metrics: AIMetricsRecorder,
): AIProviderPort {
  return {
    async generateReply(
      messages: readonly PromptMessage[],
      modelId: ModelId,
      externalSignal?: AbortSignal,
    ): Promise<MessageContent> {
      const model = modelId.toString();
      const lifecycle = createCallLifecycle(logger, metrics, model);
      lifecycle.logStart();

      try {
        if (!isConfigured(config)) {
          throw new AIProviderConfigurationError();
        }
        const gatewayModel = resolveGatewayModel(modelId);

        const { signal, cleanup } = createRequestAbortSignal(config.timeoutMs, externalSignal);
        try {
          const response = await fetch(
            buildUrl(config),
            buildRequestInit(config, gatewayModel, messages, signal, false),
          );

          if (!response.ok) {
            throw new AIProviderUpstreamError(response.status);
          }

          let content: string | undefined;
          try {
            const payload = (await response.json()) as CompatChatCompletionResponse;
            content = payload.choices?.[0]?.message?.content;
          } catch {
            content = undefined;
          }

          if (!content) {
            throw new AIProviderInvalidResponseError();
          }

          lifecycle.finish("success");
          return MessageContent.create(content);
        } finally {
          cleanup();
        }
      } catch (error) {
        throw lifecycle.fail(error);
      }
    },

    async *streamReply(
      messages: readonly PromptMessage[],
      modelId: ModelId,
      externalSignal?: AbortSignal,
    ): AsyncIterable<AIGenerationChunk> {
      const model = modelId.toString();
      const lifecycle = createCallLifecycle(logger, metrics, model);
      lifecycle.logStart();

      try {
        if (!isConfigured(config)) {
          throw new AIProviderConfigurationError();
        }
        const gatewayModel = resolveGatewayModel(modelId);

        const { signal, cleanup } = createRequestAbortSignal(config.timeoutMs, externalSignal);
        try {
          const response = await fetch(
            buildUrl(config),
            buildRequestInit(config, gatewayModel, messages, signal, true),
          );

          if (!response.ok) {
            throw new AIProviderUpstreamError(response.status);
          }
          if (!response.body) {
            throw new AIProviderInvalidResponseError();
          }

          let sawContent = false;
          for await (const delta of readContentDeltas(response.body)) {
            sawContent = true;
            yield { type: "content", delta };
          }

          if (!sawContent) {
            throw new AIProviderInvalidResponseError();
          }

          lifecycle.finish("success");
        } finally {
          cleanup();
        }
      } catch (error) {
        throw lifecycle.fail(error);
      }
    },
  };
}

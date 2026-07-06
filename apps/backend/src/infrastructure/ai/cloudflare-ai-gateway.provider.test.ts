import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareAIGatewayProvider } from "./cloudflare-ai-gateway.provider.js";
import { createInMemoryAIMetricsRecorder } from "./ai-metrics.recorder.js";
import { Conversation } from "../../domain/conversation/entities/conversation.entity.js";
import { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import {
  AIProviderCancelledError,
  AIProviderConfigurationError,
  AIProviderInvalidResponseError,
  AIProviderNetworkError,
  AIProviderTimeoutError,
  AIProviderUpstreamError,
} from "../../domain/ai-model/errors/ai-model.errors.js";
import type { Logger } from "../shared/logger.js";

const validConfig = {
  accountId: "acc-123",
  gatewayId: "gw-456",
  apiToken: "token-789",
  timeoutMs: 15_000,
};

function createFakeLogger(): Logger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("createCloudflareAIGatewayProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("llama al endpoint compat de Cloudflare AI Gateway con el modelo y los mensajes correctos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "¡hola!" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const conversation = Conversation.start();
    conversation.addMessage("user", "hola");
    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    const reply = await provider.generateReply(
      conversation,
      ModelId.fromString("gemini-2.5-flash"),
    );

    expect(reply.toString()).toBe("¡hola!");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.ai.cloudflare.com/v1/acc-123/gw-456/compat/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-789" }),
      }),
    );

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({
      model: "google-ai-studio/gemini-2.5-flash",
      messages: [{ role: "user", content: "hola" }],
    });
  });

  it("registra un log estructurado y una métrica de éxito, sin exponer el contenido del mensaje", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "respuesta secreta" } }] }),
      }),
    );

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash"));

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gemini-2.5-flash", outcome: "success" }),
      expect.any(String),
    );
    const loggedFields = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(JSON.stringify(loggedFields)).not.toContain("respuesta secreta");
    expect(JSON.stringify(loggedFields)).not.toContain("token-789");

    const snapshot = metrics.getSnapshot();
    expect(snapshot.totalCalls).toBe(1);
    expect(snapshot.successfulCalls).toBe(1);
    expect(snapshot.failedCalls).toBe(0);
  });

  it("lanza AIProviderConfigurationError si faltan credenciales configuradas", async () => {
    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(
      { accountId: "", gatewayId: "", apiToken: "", timeoutMs: 15_000 },
      logger,
      metrics,
    );

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderConfigurationError);
    expect(metrics.getSnapshot().failedCalls).toBe(1);
  });

  it("lanza AIProviderConfigurationError si el modelo no tiene mapeo de gateway", async () => {
    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("modelo-sin-mapeo")),
    ).rejects.toThrow(AIProviderConfigurationError);
  });

  it("lanza AIProviderTimeoutError cuando la llamada excede el timeout configurado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("The operation timed out.", "TimeoutError")),
    );

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderTimeoutError);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "AI_PROVIDER.TIMEOUT" }),
      expect.any(String),
    );
  });

  it("lanza AIProviderCancelledError si el cliente cancela la solicitud", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("This operation was aborted", "AbortError")),
    );

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);
    const externalController = new AbortController();

    await expect(
      provider.generateReply(
        Conversation.start(),
        ModelId.fromString("gemini-2.5-flash"),
        externalController.signal,
      ),
    ).rejects.toThrow(AIProviderCancelledError);
  });

  it("lanza AIProviderNetworkError ante un fallo de red genérico", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderNetworkError);
  });

  it("lanza AIProviderUpstreamError si el proveedor responde con un HTTP 4xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderUpstreamError);
  });

  it("lanza AIProviderUpstreamError si el proveedor responde con un HTTP 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderUpstreamError);
  });

  it("lanza AIProviderInvalidResponseError si la respuesta no contiene contenido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ choices: [] }) }),
    );

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderInvalidResponseError);
  });

  it("lanza AIProviderInvalidResponseError si el cuerpo de la respuesta no es JSON válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error("unexpected token")),
      }),
    );

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(Conversation.start(), ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderInvalidResponseError);
  });
});

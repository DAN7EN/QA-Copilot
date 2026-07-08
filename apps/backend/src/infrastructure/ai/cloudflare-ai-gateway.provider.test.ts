import { afterEach, describe, expect, it, vi } from "vitest";
import { createCloudflareAIGatewayProvider } from "./cloudflare-ai-gateway.provider.js";
import { createInMemoryAIMetricsRecorder } from "./ai-metrics.recorder.js";
import { ModelId } from "../../domain/ai-model/value-objects/model-id.vo.js";
import type { PromptMessage } from "../../domain/prompt/value-objects/prompt-message.vo.js";
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

const sampleMessages: readonly PromptMessage[] = [{ role: "user", content: "hola" }];

function createFakeLogger(): Logger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function createSseBodyStream(frames: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= frames.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(frames[index]));
      index += 1;
    },
  });
}

function createErroringBodyStream(error: unknown): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.error(error);
    },
  });
}

async function collectDeltas(
  chunks: AsyncIterable<{ type: "content"; delta: string }>,
): Promise<string[]> {
  const deltas: string[] = [];
  for await (const chunk of chunks) {
    deltas.push(chunk.delta);
  }
  return deltas;
}

describe("createCloudflareAIGatewayProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("llama al endpoint compat de Cloudflare AI Gateway con el modelo y los mensajes recibidos, sin construirlos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "¡hola!" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    const reply = await provider.generateReply(
      sampleMessages,
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
      stream: false,
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

    await provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"));

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
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderConfigurationError);
    expect(metrics.getSnapshot().failedCalls).toBe(1);
  });

  it("lanza AIProviderConfigurationError si el modelo no tiene mapeo de gateway", async () => {
    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(sampleMessages, ModelId.fromString("modelo-sin-mapeo")),
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
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
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
        sampleMessages,
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
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderNetworkError);
  });

  it("lanza AIProviderUpstreamError si el proveedor responde con un HTTP 4xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 }));

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderUpstreamError);
  });

  it("lanza AIProviderUpstreamError si el proveedor responde con un HTTP 5xx", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const logger = createFakeLogger();
    const metrics = createInMemoryAIMetricsRecorder();
    const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

    await expect(
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
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
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
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
      provider.generateReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
    ).rejects.toThrow(AIProviderInvalidResponseError);
  });

  describe("streamReply", () => {
    it("transmite los deltas de contenido a medida que llegan, solicitando stream:true", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        body: createSseBodyStream([
          'data: {"choices":[{"delta":{"content":"Hola"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":" mundo"}}]}\n\n',
          "data: [DONE]\n\n",
        ]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const logger = createFakeLogger();
      const metrics = createInMemoryAIMetricsRecorder();
      const provider = createCloudflareAIGatewayProvider(validConfig, logger, metrics);

      const deltas = await collectDeltas(
        provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash")),
      );

      expect(deltas).toEqual(["Hola", " mundo"]);

      const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
      expect(body).toMatchObject({ model: "google-ai-studio/gemini-2.5-flash", stream: true });

      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: "start" }),
        expect.any(String),
      );
      expect(metrics.getSnapshot().successfulCalls).toBe(1);
    });

    it("lanza AIProviderUpstreamError si el proveedor responde con un error HTTP", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

      const provider = createCloudflareAIGatewayProvider(
        validConfig,
        createFakeLogger(),
        createInMemoryAIMetricsRecorder(),
      );

      await expect(
        collectDeltas(provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"))),
      ).rejects.toThrow(AIProviderUpstreamError);
    });

    it("lanza AIProviderInvalidResponseError si la respuesta no tiene cuerpo", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: null }));

      const provider = createCloudflareAIGatewayProvider(
        validConfig,
        createFakeLogger(),
        createInMemoryAIMetricsRecorder(),
      );

      await expect(
        collectDeltas(provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"))),
      ).rejects.toThrow(AIProviderInvalidResponseError);
    });

    it("lanza AIProviderInvalidResponseError si no llega ningún chunk de contenido", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, body: createSseBodyStream(["data: [DONE]\n\n"]) }),
      );

      const provider = createCloudflareAIGatewayProvider(
        validConfig,
        createFakeLogger(),
        createInMemoryAIMetricsRecorder(),
      );

      await expect(
        collectDeltas(provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"))),
      ).rejects.toThrow(AIProviderInvalidResponseError);
    });

    it("lanza AIProviderInvalidResponseError si una línea data no es JSON válido", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          body: createSseBodyStream(["data: {esto no es json\n\n"]),
        }),
      );

      const provider = createCloudflareAIGatewayProvider(
        validConfig,
        createFakeLogger(),
        createInMemoryAIMetricsRecorder(),
      );

      await expect(
        collectDeltas(provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"))),
      ).rejects.toThrow(AIProviderInvalidResponseError);
    });

    it("lanza AIProviderCancelledError y registra la cancelación si el cliente cancela a mitad de la transmisión", async () => {
      const abortError = new DOMException("This operation was aborted", "AbortError");
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: true, body: createErroringBodyStream(abortError) }),
      );

      const metrics = createInMemoryAIMetricsRecorder();
      const provider = createCloudflareAIGatewayProvider(validConfig, createFakeLogger(), metrics);

      await expect(
        collectDeltas(provider.streamReply(sampleMessages, ModelId.fromString("gemini-2.5-flash"))),
      ).rejects.toThrow(AIProviderCancelledError);
      expect(metrics.getSnapshot().cancelledCalls).toBe(1);
    });
  });
});

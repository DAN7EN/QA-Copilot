import { describe, expect, it } from "vitest";
import { createInMemoryAIMetricsRecorder } from "./ai-metrics.recorder.js";

describe("createInMemoryAIMetricsRecorder", () => {
  it("acumula llamadas exitosas, fallidas y canceladas, agregadas y por modelo", () => {
    const metrics = createInMemoryAIMetricsRecorder();

    metrics.recordSuccess({
      provider: "cloudflare-ai-gateway",
      model: "gemini-2.5-flash",
      durationMs: 100,
    });
    metrics.recordSuccess({
      provider: "cloudflare-ai-gateway",
      model: "gemini-2.5-flash",
      durationMs: 300,
    });
    metrics.recordFailure({
      provider: "cloudflare-ai-gateway",
      model: "mistral-small",
      durationMs: 50,
    });
    metrics.recordCancelled({
      provider: "cloudflare-ai-gateway",
      model: "mistral-small",
      durationMs: 30,
    });

    const snapshot = metrics.getSnapshot();

    expect(snapshot.totalCalls).toBe(4);
    expect(snapshot.successfulCalls).toBe(2);
    expect(snapshot.failedCalls).toBe(1);
    expect(snapshot.cancelledCalls).toBe(1);
    expect(snapshot.averageDurationMs).toBeCloseTo(120);

    const geminiMetrics = snapshot.byModel.find((entry) => entry.model === "gemini-2.5-flash");
    expect(geminiMetrics).toMatchObject({
      calls: 2,
      successes: 2,
      failures: 0,
      cancellations: 0,
      averageDurationMs: 200,
    });

    const mistralMetrics = snapshot.byModel.find((entry) => entry.model === "mistral-small");
    expect(mistralMetrics).toMatchObject({
      calls: 2,
      successes: 0,
      failures: 1,
      cancellations: 1,
      averageDurationMs: 40,
    });
  });

  it("devuelve una foto en cero cuando no hubo llamadas", () => {
    const metrics = createInMemoryAIMetricsRecorder();

    expect(metrics.getSnapshot()).toEqual({
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      cancelledCalls: 0,
      averageDurationMs: 0,
      byModel: [],
    });
  });
});

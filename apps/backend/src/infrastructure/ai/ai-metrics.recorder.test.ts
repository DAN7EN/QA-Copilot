import { describe, expect, it } from "vitest";
import { createInMemoryAIMetricsRecorder } from "./ai-metrics.recorder.js";

describe("createInMemoryAIMetricsRecorder", () => {
  it("acumula llamadas exitosas y fallidas, agregadas y por modelo", () => {
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

    const snapshot = metrics.getSnapshot();

    expect(snapshot.totalCalls).toBe(3);
    expect(snapshot.successfulCalls).toBe(2);
    expect(snapshot.failedCalls).toBe(1);
    expect(snapshot.averageDurationMs).toBeCloseTo(150);

    const geminiMetrics = snapshot.byModel.find((entry) => entry.model === "gemini-2.5-flash");
    expect(geminiMetrics).toMatchObject({
      calls: 2,
      successes: 2,
      failures: 0,
      averageDurationMs: 200,
    });

    const mistralMetrics = snapshot.byModel.find((entry) => entry.model === "mistral-small");
    expect(mistralMetrics).toMatchObject({
      calls: 1,
      successes: 0,
      failures: 1,
      averageDurationMs: 50,
    });
  });

  it("devuelve una foto en cero cuando no hubo llamadas", () => {
    const metrics = createInMemoryAIMetricsRecorder();

    expect(metrics.getSnapshot()).toEqual({
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageDurationMs: 0,
      byModel: [],
    });
  });
});

/**
 * Métricas básicas de la integración con IA, guardadas en memoria.
 *
 * No integra Prometheus ni ningún exportador: solo deja la estructura lista
 * para que un sprint futuro conecte un exportador real (por ejemplo, exponer
 * `getSnapshot()` en un endpoint interno o registrarlo en un cliente de
 * Prometheus) sin tener que tocar el adaptador que genera estas métricas.
 */
export type AIModelMetrics = {
  provider: string;
  model: string;
  calls: number;
  successes: number;
  failures: number;
  cancellations: number;
  averageDurationMs: number;
};

export type AIMetricsSnapshot = {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cancelledCalls: number;
  averageDurationMs: number;
  byModel: AIModelMetrics[];
};

export type RecordAICallInput = {
  provider: string;
  model: string;
  durationMs: number;
};

export interface AIMetricsRecorder {
  recordSuccess(input: RecordAICallInput): void;
  recordFailure(input: RecordAICallInput): void;
  /** Una cancelación iniciada por el cliente no es un fallo del sistema: se cuenta aparte. */
  recordCancelled(input: RecordAICallInput): void;
  getSnapshot(): AIMetricsSnapshot;
}

type Outcome = "success" | "failure" | "cancelled";

type Accumulator = {
  provider: string;
  model: string;
  calls: number;
  successes: number;
  failures: number;
  cancellations: number;
  totalDurationMs: number;
};

function toModelMetrics(accumulator: Accumulator): AIModelMetrics {
  return {
    provider: accumulator.provider,
    model: accumulator.model,
    calls: accumulator.calls,
    successes: accumulator.successes,
    failures: accumulator.failures,
    cancellations: accumulator.cancellations,
    averageDurationMs:
      accumulator.calls === 0 ? 0 : accumulator.totalDurationMs / accumulator.calls,
  };
}

export function createInMemoryAIMetricsRecorder(): AIMetricsRecorder {
  const accumulatorsByKey = new Map<string, Accumulator>();

  function getOrCreateAccumulator(provider: string, model: string): Accumulator {
    const key = `${provider}:${model}`;
    const existing = accumulatorsByKey.get(key);

    if (existing) {
      return existing;
    }

    const created: Accumulator = {
      provider,
      model,
      calls: 0,
      successes: 0,
      failures: 0,
      cancellations: 0,
      totalDurationMs: 0,
    };
    accumulatorsByKey.set(key, created);
    return created;
  }

  function record(input: RecordAICallInput, outcome: Outcome): void {
    const accumulator = getOrCreateAccumulator(input.provider, input.model);
    accumulator.calls += 1;
    accumulator.totalDurationMs += input.durationMs;

    if (outcome === "success") {
      accumulator.successes += 1;
    } else if (outcome === "cancelled") {
      accumulator.cancellations += 1;
    } else {
      accumulator.failures += 1;
    }
  }

  return {
    recordSuccess(input) {
      record(input, "success");
    },
    recordFailure(input) {
      record(input, "failure");
    },
    recordCancelled(input) {
      record(input, "cancelled");
    },
    getSnapshot(): AIMetricsSnapshot {
      const byModel = [...accumulatorsByKey.values()].map(toModelMetrics);
      const totalCalls = byModel.reduce((sum, entry) => sum + entry.calls, 0);
      const successfulCalls = byModel.reduce((sum, entry) => sum + entry.successes, 0);
      const failedCalls = byModel.reduce((sum, entry) => sum + entry.failures, 0);
      const cancelledCalls = byModel.reduce((sum, entry) => sum + entry.cancellations, 0);
      const totalDurationMs = [...accumulatorsByKey.values()].reduce(
        (sum, entry) => sum + entry.totalDurationMs,
        0,
      );

      return {
        totalCalls,
        successfulCalls,
        failedCalls,
        cancelledCalls,
        averageDurationMs: totalCalls === 0 ? 0 : totalDurationMs / totalCalls,
        byModel,
      };
    },
  };
}

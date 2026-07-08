import { afterEach, describe, expect, it, vi } from "vitest";
import { postSse } from "./sseClient";

function createBodyStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
    },
  });
}

async function collect<T>(generator: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of generator) {
    items.push(item);
  }
  return items;
}

describe("postSse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parsea eventos SSE completos, incluso cuando llegan repartidos entre chunks de red", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: createBodyStream([
          'event: chunk\ndata: {"delta":"Hol',
          'a"}\n\n',
          'event: completed\ndata: {"id":"1"}\n\n',
        ]),
      }),
    );

    const events = await collect(
      await postSse("/conversations/1/generate/stream", { modelId: "x" }),
    );

    expect(events).toEqual([
      { event: "chunk", data: '{"delta":"Hola"}' },
      { event: "completed", data: '{"id":"1"}' },
    ]);
  });

  it("lanza un error si la respuesta HTTP no es exitosa", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        body: null,
      }),
    );

    await expect(postSse("/conversations/1/generate/stream", { modelId: "x" })).rejects.toThrow(
      "HTTP 500",
    );
  });
});

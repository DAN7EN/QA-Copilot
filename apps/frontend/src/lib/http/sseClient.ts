import { baseUrl } from "./httpClient";

export type SseEvent = {
  event: string;
  data: string;
};

function toSseEvent(frame: string): SseEvent | null {
  let event = "message";
  let data = "";

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice("data:".length).trim();
    }
  }

  return data.length > 0 ? { event, data } : null;
}

async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
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
        const event = toSseEvent(frame);
        if (event) {
          yield event;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * POST que consume una respuesta `text/event-stream` con las APIs nativas del
 * navegador (fetch + ReadableStream). No se usa `EventSource` porque no
 * soporta cuerpos POST, necesarios aquí para enviar `modelId`.
 */
export async function postSse(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<AsyncGenerator<SseEvent>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return parseSseStream(response.body);
}

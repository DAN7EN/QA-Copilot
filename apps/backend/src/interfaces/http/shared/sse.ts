import type { FastifyReply } from "fastify";

/**
 * Toma control manual de la respuesta HTTP para escribir eventos SSE. Tras
 * llamar a esto, Fastify ya no gestiona la respuesta: toda escritura y el
 * cierre final son responsabilidad de quien la invoque.
 */
export function startSseStream(reply: FastifyReply): void {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  reply.raw.flushHeaders();
}

function isStreamClosed(reply: FastifyReply): boolean {
  return reply.raw.writableEnded || reply.raw.destroyed;
}

export function writeSseEvent(reply: FastifyReply, event: string, data: unknown): void {
  if (isStreamClosed(reply)) {
    return;
  }

  reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function endSseStream(reply: FastifyReply): void {
  if (!isStreamClosed(reply)) {
    reply.raw.end();
  }
}

import type { FastifyReply } from "fastify";

/**
 * Toma control manual de la respuesta HTTP para escribir eventos SSE. Tras
 * llamar a esto, Fastify ya no gestiona la respuesta: toda escritura y el
 * cierre final son responsabilidad de quien la invoque.
 *
 * reply.hijack() saca la respuesta del ciclo de vida de Fastify, así que
 * ningún header preparado por plugins vía reply.header() (p. ej.
 * @fastify/cors en su hook onRequest) llega a escribirse en la respuesta
 * cruda: esos headers solo se aplican en el send() normal de Fastify, que
 * aquí nunca ocurre. Por eso el header CORS se escribe aquí explícitamente
 * a partir de la configuración de CORS de la app, en vez de depender de que
 * el plugin lo haya dejado en algún estado leíble tras el hijack.
 */
export function startSseStream(reply: FastifyReply, corsOrigin: string): void {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": corsOrigin,
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

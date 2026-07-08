import type { FastifyReply } from "fastify";

/**
 * Detecta que el cliente HTTP cerró la conexión antes de que la respuesta
 * terminara de enviarse (`writableEnded` sigue en `false`), y por lo tanto
 * distingue un cierre prematuro de una finalización normal.
 */
export function onClientDisconnect(reply: FastifyReply, callback: () => void): () => void {
  const listener = (): void => {
    if (!reply.raw.writableEnded) {
      callback();
    }
  };

  reply.raw.on("close", listener);
  return () => reply.raw.off("close", listener);
}

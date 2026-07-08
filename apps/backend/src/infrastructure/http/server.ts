import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export function buildServer(corsOrigin: string): FastifyInstance {
  const app = Fastify({ logger: true });
  void app.register(cors, { origin: corsOrigin });
  return app;
}

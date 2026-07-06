import type { FastifyInstance } from "fastify";
import type { HealthResponse } from "@qa-copilot/shared";

const healthResponse: HealthResponse = { status: "ok", service: "qa-copilot-api" };

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/api/v1/health", async (): Promise<HealthResponse> => healthResponse);
}

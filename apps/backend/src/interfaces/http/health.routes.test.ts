import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerHealthRoutes } from "./health.routes.js";

describe("GET /api/v1/health", () => {
  it("responde con el estado del servicio", async () => {
    const app = Fastify();
    registerHealthRoutes(app);

    const response = await app.inject({ method: "GET", url: "/api/v1/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", service: "qa-copilot-api" });
  });
});

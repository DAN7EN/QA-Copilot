import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerCapabilityRoutes } from "./capability.routes.js";
import { createListCapabilitiesUseCase } from "../../../application/capability/list-capabilities.use-case.js";

describe("Capability routes", () => {
  it("GET /api/v1/capabilities devuelve las capacidades registradas", async () => {
    const app = Fastify();
    registerCapabilityRoutes(app, { listCapabilities: createListCapabilitiesUseCase() });

    const response = await app.inject({ method: "GET", url: "/api/v1/capabilities" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: "chat",
        name: "Chat",
        description: "Conversación general con el asistente de QA Copilot.",
      },
      {
        id: "gherkin",
        name: "Gherkin Generator",
        description: "Generate high quality Gherkin scenarios from software requirements.",
      },
    ]);
  });
});

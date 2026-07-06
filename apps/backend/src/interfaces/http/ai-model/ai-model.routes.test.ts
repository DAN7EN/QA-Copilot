import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { registerAIModelRoutes } from "./ai-model.routes.js";
import { createListModelsUseCase } from "../../../application/ai-model/list-models.use-case.js";

describe("AI model routes", () => {
  it("GET /api/v1/models devuelve el catálogo de modelos disponibles", async () => {
    const app = Fastify();
    registerAIModelRoutes(app, { listModels: createListModelsUseCase() });

    const response = await app.inject({ method: "GET", url: "/api/v1/models" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash" }),
      ]),
    );
  });
});

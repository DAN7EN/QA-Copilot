import type { FastifyInstance } from "fastify";
import type { ListModelsUseCase } from "../../../application/ai-model/list-models.use-case.js";
import { toAIModelDto } from "./ai-model.mapper.js";

export type AIModelRouteDependencies = {
  listModels: ListModelsUseCase;
};

export function registerAIModelRoutes(app: FastifyInstance, deps: AIModelRouteDependencies): void {
  app.get("/api/v1/models", async () => {
    const models = await deps.listModels.execute();
    return models.map(toAIModelDto);
  });
}

import type { AIModel } from "../../domain/ai-model/value-objects/ai-model.vo.js";
import { listModels } from "../../domain/ai-model/model-registry.js";

export interface ListModelsUseCase {
  execute(): Promise<readonly AIModel[]>;
}

export function createListModelsUseCase(): ListModelsUseCase {
  return {
    async execute(): Promise<readonly AIModel[]> {
      return listModels();
    },
  };
}

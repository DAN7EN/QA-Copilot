import type { AIModelDto } from "@qa-copilot/shared";
import type { AIModel } from "../../../domain/ai-model/value-objects/ai-model.vo.js";

export function toAIModelDto(model: AIModel): AIModelDto {
  return {
    id: model.getId().toString(),
    displayName: model.getDisplayName(),
    provider: model.getProvider(),
    capabilities: [...model.getCapabilities()],
  };
}

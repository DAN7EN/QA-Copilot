import type { GherkinResultDto } from "@qa-copilot/shared";
import type { GherkinResult } from "../../../application/gherkin/gherkin-result.js";

export function toGherkinResultDto(result: GherkinResult): GherkinResultDto {
  return {
    title: result.title,
    feature: result.feature,
    background: result.background,
    scenarios: result.scenarios.map((scenario) => ({
      title: scenario.title,
      steps: [...scenario.steps],
    })),
    rawMarkdown: result.rawMarkdown,
  };
}

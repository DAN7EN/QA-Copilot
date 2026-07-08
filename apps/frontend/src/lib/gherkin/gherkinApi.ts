import type { GenerateGherkinRequest, GherkinResultDto } from "@qa-copilot/shared";
import { httpClient } from "../http/httpClient";

export const gherkinApi = {
  generate: (conversationId: string, modelId: string): Promise<GherkinResultDto> =>
    httpClient.post<GherkinResultDto>(`/conversations/${conversationId}/capabilities/gherkin`, {
      modelId,
    } satisfies GenerateGherkinRequest),
};

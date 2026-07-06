import type { AIModelDto } from "@qa-copilot/shared";
import { httpClient } from "../http/httpClient";

export const aiModelApi = {
  list: (): Promise<AIModelDto[]> => httpClient.get<AIModelDto[]>("/models"),
};

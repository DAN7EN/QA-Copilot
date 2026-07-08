import type { CapabilityDto } from "@qa-copilot/shared";
import { httpClient } from "../http/httpClient";

export const capabilityApi = {
  list: (): Promise<CapabilityDto[]> => httpClient.get<CapabilityDto[]>("/capabilities"),
};

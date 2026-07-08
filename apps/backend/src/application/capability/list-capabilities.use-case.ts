import type { Capability } from "../../domain/capability/value-objects/capability.vo.js";
import { listCapabilities } from "../../domain/capability/capability-registry.js";

export interface ListCapabilitiesUseCase {
  execute(): Promise<readonly Capability[]>;
}

export function createListCapabilitiesUseCase(): ListCapabilitiesUseCase {
  return {
    async execute(): Promise<readonly Capability[]> {
      return listCapabilities();
    },
  };
}

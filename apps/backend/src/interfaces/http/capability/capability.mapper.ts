import type { CapabilityDto } from "@qa-copilot/shared";
import type { Capability } from "../../../domain/capability/value-objects/capability.vo.js";

export function toCapabilityDto(capability: Capability): CapabilityDto {
  return {
    id: capability.id,
    name: capability.name,
    description: capability.description,
  };
}

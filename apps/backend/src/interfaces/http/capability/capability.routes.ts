import type { FastifyInstance } from "fastify";
import type { ListCapabilitiesUseCase } from "../../../application/capability/list-capabilities.use-case.js";
import { toCapabilityDto } from "./capability.mapper.js";

export type CapabilityRouteDependencies = {
  listCapabilities: ListCapabilitiesUseCase;
};

export function registerCapabilityRoutes(
  app: FastifyInstance,
  deps: CapabilityRouteDependencies,
): void {
  app.get("/api/v1/capabilities", async () => {
    const capabilities = await deps.listCapabilities.execute();
    return capabilities.map(toCapabilityDto);
  });
}

import type { ModelId } from "./model-id.vo.js";

/**
 * Descripción de un modelo de IA disponible para el Conversation Core.
 * No contiene ningún dato del proveedor de infraestructura (Cloudflare): ese
 * mapeo vive exclusivamente en el adaptador correspondiente.
 */
export class AIModel {
  constructor(
    private readonly id: ModelId,
    private readonly displayName: string,
    private readonly provider: string,
    private readonly capabilities: readonly string[],
  ) {}

  getId(): ModelId {
    return this.id;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getProvider(): string {
    return this.provider;
  }

  getCapabilities(): readonly string[] {
    return this.capabilities;
  }
}

import type { ComponentType } from "react";
import { FileText, MessageSquare, type LucideIcon } from "lucide-react";
import { GherkinRightPanel } from "@/components/gherkin/GherkinRightPanel";
import { useGherkinStore } from "@/stores/gherkin.store";
import { useStreamingStore } from "@/stores/streaming.store";

/**
 * Contraparte frontend del Capability Registry del backend
 * (`domain/capability/capability-registry.ts`): una única fuente de verdad
 * de cómo se ve y se ejecuta cada capacidad en la UI. Agregar una capacidad
 * nueva es agregar una entrada acá, sin tocar ChatPage ni RightPanel.
 */
export type CapabilityUiDescriptor = {
  id: string;
  icon: LucideIcon;
  runGeneration: (conversationId: string, modelId: string) => Promise<void>;
  /** Renderer del panel derecho para el resultado de esta capacidad. Si se omite, se muestra el panel genérico. */
  RightPanel?: ComponentType;
  getError: () => string | null;
};

const CAPABILITY_DESCRIPTORS: readonly CapabilityUiDescriptor[] = [
  {
    id: "chat",
    icon: MessageSquare,
    runGeneration: (conversationId, modelId) =>
      useStreamingStore.getState().generateReply(conversationId, modelId),
    getError: () => useStreamingStore.getState().error,
  },
  {
    id: "gherkin",
    icon: FileText,
    runGeneration: (conversationId, modelId) =>
      useGherkinStore.getState().generate(conversationId, modelId),
    RightPanel: GherkinRightPanel,
    getError: () => useGherkinStore.getState().error,
  },
];

export function getCapabilityDescriptor(id: string): CapabilityUiDescriptor | undefined {
  return CAPABILITY_DESCRIPTORS.find((descriptor) => descriptor.id === id);
}

export function listCapabilityDescriptors(): readonly CapabilityUiDescriptor[] {
  return CAPABILITY_DESCRIPTORS;
}

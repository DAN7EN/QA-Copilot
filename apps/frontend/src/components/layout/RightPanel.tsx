import { PanelRight } from "lucide-react";
import { getCapabilityDescriptor } from "@/lib/capability/capability-registry";
import { useConversationStore } from "@/stores/conversation.store";

function EmptyPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PanelRight className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Panel de resultados</p>
        <p className="text-xs text-muted-foreground">
          Acá vivirán las propiedades, resultados, Gherkin, casos de prueba y Playwright de futuras
          capacidades.
        </p>
      </div>
    </div>
  );
}

/**
 * Shell del panel derecho: no conoce ninguna capacidad en particular. Despacha
 * el renderer registrado para la capacidad activa (ver `capability-registry`)
 * y cae al panel genérico si la capacidad no registró uno.
 */
export function RightPanel() {
  const selectedCapabilityId = useConversationStore((state) => state.selectedCapabilityId);
  const descriptor = getCapabilityDescriptor(selectedCapabilityId);
  const CapabilityRightPanel = descriptor?.RightPanel;

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-card/40 lg:flex">
      {CapabilityRightPanel ? <CapabilityRightPanel /> : <EmptyPanel />}
    </aside>
  );
}

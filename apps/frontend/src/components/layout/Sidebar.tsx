import { PanelLeftClose, PanelLeftOpen, Plus, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConversationList } from "@/components/conversation/ConversationList";
import { useConversationStore } from "@/stores/conversation.store";
import { useUiStore } from "@/stores/ui.store";

export function Sidebar() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  const conversations = useConversationStore((state) => state.conversations);
  const activeConversation = useConversationStore((state) => state.activeConversation);
  const isLoading = useConversationStore((state) => state.isLoading);
  const startConversation = useConversationStore((state) => state.startConversation);
  const selectConversation = useConversationStore((state) => state.selectConversation);
  const models = useConversationStore((state) => state.models);
  const capabilities = useConversationStore((state) => state.capabilities);
  const selectedModelId = useConversationStore((state) => state.selectedModelId);
  const selectedCapabilityId = useConversationStore((state) => state.selectedCapabilityId);

  const selectedModel = models.find((model) => model.id === selectedModelId);
  const selectedCapability = capabilities.find(
    (capability) => capability.id === selectedCapabilityId,
  );

  if (sidebarCollapsed) {
    return (
      <aside className="flex h-full w-14 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <SquareTerminal className="size-4" />
        </div>
        <Separator className="my-1 w-8" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void startConversation()}
          title="Nueva conversación"
        >
          <Plus />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Expandir sidebar">
          <PanelLeftOpen />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <SquareTerminal className="size-4" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">QA Copilot</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Colapsar sidebar">
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="px-3 pb-3">
        <Button className="w-full justify-start gap-2" onClick={() => void startConversation()}>
          <Plus className="size-4" />
          Nueva conversación
        </Button>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 py-2">
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          isLoading={isLoading}
          onSelect={(conversationId) => void selectConversation(conversationId)}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5 px-3 py-3 text-xs text-muted-foreground">
        <SidebarInfoRow label="Capacidad" value={selectedCapability?.name ?? "—"} />
        <SidebarInfoRow label="Modelo" value={selectedModel?.displayName ?? "—"} />
      </div>
    </aside>
  );
}

function SidebarInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="truncate font-medium text-sidebar-foreground">{value}</span>
    </div>
  );
}

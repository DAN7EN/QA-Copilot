import { PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deriveConversationTitle } from "@/lib/conversation/presentation";
import { useConversationStore } from "@/stores/conversation.store";
import { useUiStore } from "@/stores/ui.store";

export function Header() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const activeConversation = useConversationStore((state) => state.activeConversation);

  const title = activeConversation
    ? deriveConversationTitle(activeConversation)
    : "Nueva conversación";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
      {sidebarCollapsed && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Expandir sidebar">
          <PanelLeftOpen className="size-4" />
        </Button>
      )}
      <h1 className="truncate text-sm font-medium text-foreground">{title}</h1>
    </header>
  );
}

import { useState, type KeyboardEvent } from "react";
import type { ConversationDto } from "@qa-copilot/shared";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { deriveConversationTitle, formatRelativeTime } from "@/lib/conversation/presentation";
import { useConversationStore } from "@/stores/conversation.store";

type ConversationListItemProps = {
  conversation: ConversationDto;
  isActive: boolean;
  onSelect: (conversationId: string) => void;
};

export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
}: ConversationListItemProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  function startRenaming() {
    setDraftTitle(deriveConversationTitle(conversation));
    setIsRenaming(true);
  }

  async function submitRename() {
    const trimmed = draftTitle.trim();
    setIsRenaming(false);

    if (trimmed.length === 0 || trimmed === deriveConversationTitle(conversation)) {
      return;
    }

    await useConversationStore.getState().renameConversation(conversation.id, trimmed);
  }

  function handleRenameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitRename();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsRenaming(false);
    }
  }

  async function handleConfirmDelete() {
    setIsConfirmingDelete(false);
    await useConversationStore.getState().deleteConversation(conversation.id);
  }

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-1 rounded-md pr-1 text-left text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      {isRenaming ? (
        <Input
          autoFocus
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={() => void submitRename()}
          aria-label="Renombrar conversación"
          className="my-1 ml-3 h-7"
        />
      ) : (
        <button
          type="button"
          onClick={() => onSelect(conversation.id)}
          aria-current={isActive ? "true" : undefined}
          className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2"
        >
          <span className="w-full truncate font-medium">
            {deriveConversationTitle(conversation)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(conversation.updatedAt)}
          </span>
        </button>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
              title="Más opciones"
              aria-label="Más opciones de la conversación"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={startRenaming}>Renombrar</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => setIsConfirmingDelete(true)}>
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar esta conversación?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDelete()}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

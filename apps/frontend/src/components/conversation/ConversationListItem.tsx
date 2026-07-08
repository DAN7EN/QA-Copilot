import type { ConversationDto } from "@qa-copilot/shared";
import { cn } from "@/lib/utils";
import { deriveConversationTitle, formatRelativeTime } from "@/lib/conversation/presentation";

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
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <span className="w-full truncate font-medium">{deriveConversationTitle(conversation)}</span>
      <span className="text-xs text-muted-foreground">
        {formatRelativeTime(conversation.updatedAt)}
      </span>
    </button>
  );
}

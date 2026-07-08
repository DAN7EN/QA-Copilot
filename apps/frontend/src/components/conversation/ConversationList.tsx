import type { ConversationDto } from "@qa-copilot/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationListItem } from "./ConversationListItem";

type ConversationListProps = {
  conversations: ConversationDto[];
  activeConversationId?: string;
  isLoading: boolean;
  onSelect: (conversationId: string) => void;
};

export function ConversationList({
  conversations,
  activeConversationId,
  isLoading,
  onSelect,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 px-1">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">Aún no hay conversaciones.</p>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 px-1">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

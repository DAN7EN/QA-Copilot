import { Bot, User } from "lucide-react";
import type { MessageDto } from "@qa-copilot/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ChatMessageProps = {
  message: MessageDto;
};

function formatTime(dateIso: string): string {
  return new Date(dateIso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 px-4 py-4", !isUser && "bg-card/40")}>
      <Avatar>
        <AvatarFallback className={isUser ? "bg-secondary" : "bg-primary text-primary-foreground"}>
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">
            {isUser ? "Tú" : "QA Copilot"}
          </span>
          <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {message.content}
        </p>
      </div>
    </div>
  );
}

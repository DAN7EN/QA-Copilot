import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type StreamingMessageProps = {
  text: string;
};

export function StreamingMessage({ text }: StreamingMessageProps) {
  return (
    <div className="flex gap-3 bg-card/40 px-4 py-4">
      <Avatar>
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="text-sm font-medium text-foreground">QA Copilot</span>
        {text.length > 0 ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {text}
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-foreground/60 align-text-bottom" />
          </p>
        ) : (
          <div className="flex items-center gap-1 py-1.5">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

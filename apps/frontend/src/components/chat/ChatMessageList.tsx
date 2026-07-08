import { useEffect, useRef } from "react";
import type { MessageDto } from "@qa-copilot/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { StreamingMessage } from "./StreamingMessage";

type ChatMessageListProps = {
  messages: MessageDto[];
  streamingText: string;
  isGenerating: boolean;
};

export function ChatMessageList({ messages, streamingText, isGenerating }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, streamingText]);

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col divide-y divide-border">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isGenerating && <StreamingMessage text={streamingText} />}
      </div>
      <div ref={bottomRef} />
    </ScrollArea>
  );
}

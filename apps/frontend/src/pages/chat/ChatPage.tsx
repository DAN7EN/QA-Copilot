import { useEffect } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { EmptyState } from "@/components/conversation/EmptyState";
import {
  getCapabilityDescriptor,
  useActiveGenerationState,
} from "@/lib/capability/capability-registry";
import { useConversationStore } from "@/stores/conversation.store";
import { useStreamingStore } from "@/stores/streaming.store";

export function ChatPage() {
  const activeConversation = useConversationStore((state) => state.activeConversation);
  const isSending = useConversationStore((state) => state.isSending);
  const conversationError = useConversationStore((state) => state.error);
  const loadInitialData = useConversationStore((state) => state.loadInitialData);
  const startConversation = useConversationStore((state) => state.startConversation);

  const isStreamingReply = useStreamingStore((state) => state.isGenerating);
  const streamingText = useStreamingStore((state) => state.streamingText);
  const cancel = useStreamingStore((state) => state.cancel);

  // Agregado de todas las capacidades: deshabilita el input mientras cualquiera
  // esté generando. La burbuja de "escribiendo..." del chat, en cambio, es
  // específica del streaming de texto y usa isStreamingReply directamente.
  const { isGenerating, error: capabilityError } = useActiveGenerationState();

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  async function handleSend(content: string) {
    const updated = await useConversationStore.getState().sendMessage(content);
    if (!updated) {
      return;
    }

    const { selectedModelId, selectedCapabilityId } = useConversationStore.getState();
    if (!selectedModelId) {
      return;
    }

    const descriptor = getCapabilityDescriptor(selectedCapabilityId);
    await descriptor?.runGeneration(updated.id, selectedModelId);
  }

  const error = conversationError ?? capabilityError;

  if (!activeConversation) {
    return <EmptyState onStartConversation={() => void startConversation()} error={error} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ChatMessageList
          messages={activeConversation.messages}
          streamingText={streamingText}
          isGenerating={isStreamingReply}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mx-4 mb-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <ChatInput
        disabled={isSending || isGenerating}
        isGenerating={isStreamingReply}
        onSend={(content) => void handleSend(content)}
        onCancel={cancel}
      />
    </div>
  );
}

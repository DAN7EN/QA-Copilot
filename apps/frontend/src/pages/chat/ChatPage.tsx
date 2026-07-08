import { useEffect } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { EmptyState } from "@/components/conversation/EmptyState";
import { useConversationStore } from "@/stores/conversation.store";
import { useStreamingStore } from "@/stores/streaming.store";
import { useGherkinStore } from "@/stores/gherkin.store";

const GHERKIN_CAPABILITY_ID = "gherkin";

export function ChatPage() {
  const activeConversation = useConversationStore((state) => state.activeConversation);
  const isSending = useConversationStore((state) => state.isSending);
  const conversationError = useConversationStore((state) => state.error);
  const loadInitialData = useConversationStore((state) => state.loadInitialData);
  const startConversation = useConversationStore((state) => state.startConversation);

  const isGenerating = useStreamingStore((state) => state.isGenerating);
  const streamingText = useStreamingStore((state) => state.streamingText);
  const streamingError = useStreamingStore((state) => state.error);
  const cancel = useStreamingStore((state) => state.cancel);

  const isGeneratingGherkin = useGherkinStore((state) => state.isGenerating);
  const gherkinError = useGherkinStore((state) => state.error);

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

    if (selectedCapabilityId === GHERKIN_CAPABILITY_ID) {
      await useGherkinStore.getState().generate(updated.id, selectedModelId);
      return;
    }

    await useStreamingStore.getState().generateReply(updated.id, selectedModelId);
  }

  const error = conversationError ?? streamingError ?? gherkinError;

  if (!activeConversation) {
    return <EmptyState onStartConversation={() => void startConversation()} error={error} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <ChatMessageList
          messages={activeConversation.messages}
          streamingText={streamingText}
          isGenerating={isGenerating}
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
        disabled={isSending || isGenerating || isGeneratingGherkin}
        isGenerating={isGenerating}
        onSend={(content) => void handleSend(content)}
        onCancel={cancel}
      />
    </div>
  );
}

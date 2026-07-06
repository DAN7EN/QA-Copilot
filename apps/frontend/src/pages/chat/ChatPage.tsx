import { useEffect, useState } from "react";
import type { AIModelDto, ConversationDto } from "@qa-copilot/shared";
import { aiModelApi } from "../../lib/ai-model/aiModelApi";
import { conversationApi } from "../../lib/conversation/conversationApi";

export function ChatPage() {
  const [models, setModels] = useState<AIModelDto[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    aiModelApi
      .list()
      .then((availableModels) => {
        setModels(availableModels);
        setSelectedModelId((current) => current || (availableModels[0]?.id ?? ""));
      })
      .catch((err: unknown) => setError((err as Error).message));
  }, []);

  async function handleStartConversation() {
    setError(null);
    try {
      const started = await conversationApi.start();
      setConversation(started);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleSend() {
    if (!conversation || !selectedModelId || input.trim().length === 0) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const afterUserMessage = await conversationApi.sendMessage(conversation.id, input);
      setConversation(afterUserMessage);
      setInput("");

      const afterReply = await conversationApi.generateReply(conversation.id, selectedModelId);
      setConversation(afterReply);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section>
      <h1>Chat</h1>

      <div>
        <label htmlFor="model-select">Modelo</label>
        <select
          id="model-select"
          value={selectedModelId}
          onChange={(event) => setSelectedModelId(event.target.value)}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName} ({model.provider})
            </option>
          ))}
        </select>
      </div>

      {!conversation && (
        <button onClick={() => void handleStartConversation()}>Iniciar conversación</button>
      )}

      {conversation && (
        <>
          <ul>
            {conversation.messages.map((message) => (
              <li key={message.id}>
                <strong>{message.role}:</strong> {message.content}
              </li>
            ))}
          </ul>

          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={() => void handleSend()}
            disabled={isLoading || input.trim().length === 0}
          >
            {isLoading ? "Enviando..." : "Enviar"}
          </button>
        </>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}

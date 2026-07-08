import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CapabilitySelector } from "./CapabilitySelector";
import { ModelSelector } from "./ModelSelector";

type ChatInputProps = {
  disabled: boolean;
  isGenerating: boolean;
  onSend: (content: string) => void;
  onCancel: () => void;
};

const MAX_TEXTAREA_HEIGHT_PX = 200;

export function ChatInput({ disabled, isGenerating, onSend, onCancel }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length === 0 || disabled) {
      return;
    }
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-lg border border-input bg-card p-2 shadow-sm">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu mensaje..."
          aria-label="Mensaje"
          disabled={disabled}
          rows={1}
          className="max-h-[200px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ModelSelector />
            <CapabilitySelector />
          </div>
          {isGenerating ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onCancel}
              title="Cancelar"
              aria-label="Cancelar"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={disabled || value.trim().length === 0}
              title="Enviar"
              aria-label="Enviar"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
